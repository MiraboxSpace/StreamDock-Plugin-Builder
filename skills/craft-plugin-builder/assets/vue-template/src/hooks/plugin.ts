import { defineStore } from 'pinia';

export type LightEffectStyle = 'glow' | 'corners' | 'scan' | 'ripple' | 'stripes';
export type LightEffectRect = { x: number; y: number; width: number; height: number };
export type LightControlPayload = {
  active: boolean;
  effectStyle?: LightEffectStyle;
  alarmColor?: string;
  effectRect?: LightEffectRect | null;
  effectOpacity?: number;
  tintOpacity?: number;
  glowWidth?: number;
  diffusion?: number;
  borderWidth?: number;
  cornerRadius?: number;
  pulseEnabled?: boolean;
  pulseDuration?: number;
  minimumIntensity?: number;
};

// 插件钩子
export const usePluginStore = defineStore('pluginStore', () => {
  document.title = window.argv[3].plugin.uuid + ' - 插件';

  // 定时器线程
  const Timer = new Worker('interval.js');
  const TimerSubscribe: { uuid: string; fn: () => void }[] = [];
  Timer.addEventListener('message', ({ data: { event, uuid } }: { data: { event: string; uuid: string } }) => {
    const subIndex = TimerSubscribe.findIndex((item) => item.uuid === uuid);
    subIndex !== -1 && event === 'setInterval' && TimerSubscribe[subIndex].fn();
  });

  // 创建定时器
  const Interval = (uuid: string, delay: number, fn: () => void) => {
    TimerSubscribe.findIndex((item) => item.uuid === uuid) === -1 && TimerSubscribe.push({ uuid, fn });
    Timer.postMessage({ event: 'setInterval', uuid, delay });
  };

  // 销毁定时器
  const Unterval = (uuid: string) => {
    const subIndex = TimerSubscribe.findIndex((item) => item.uuid === uuid);
    subIndex !== -1 && TimerSubscribe.splice(subIndex, 1);
    Timer.postMessage({ event: 'clearInterval', uuid });
  };

  // 连接软件
  const message = ref<StreamDock.Message>();
  let server = null;
  function connect() {
    server = new WebSocket('ws://127.0.0.1:' + window.argv[0]);

    server.onopen = () => {
      server.send(JSON.stringify({ event: window.argv[2], uuid: window.argv[1] }));
    };

    server.onmessage = (e) => {
      message.value = JSON.parse(e.data);
    };

    server.onerror = () => {
      server.close(); // 关闭连接以触发 `onclose`
    };

    server.onclose = () => {
      setTimeout(connect, 1000); // 延迟重连
    };
  }

  connect();

  // 控制 Craft 屏幕上的全局光效覆盖层。active=false 用于关闭光效。
  const lightControl = (payload: LightControlPayload) => {
    if (!server || server.readyState !== WebSocket.OPEN) return;
    server.send(JSON.stringify({ event: 'lightControl', payload }));
  };

  // 操作数据存储
  class Actions {
    settings: {};
    action: string;
    context: string;
    title: string;
    titleParameters = {} as titleParameters;
    constructor(action: string, context: string, settings: {}) {
      this.action = action;
      this.context = context;
      this.settings = settings;
    }

    // 添加操作
    static list: Actions[] = [];
    static addAction = (action: string, context: string, settings: {}) => {
      const instance = new Actions(action, context, settings);
      this.list.push(instance);
      return instance;
    };

    // 删除操作
    static delAction = (context: string) => {
      const i = this.list.findIndex((item) => item.context === context);
      i !== -1 && this.list.splice(i, 1);
    };

    // 获取操作数据
    static getAction = (context: string) => {
      return Actions.list.find((item) => item.context === context);
    };

    // 获取所有操作数据
    static getActions = (action: string) => {
      return this.list.filter((item) => item.action === action);
    };

    // 通知属性检查器
    sendToPropertyInspector = (payload: any) => {
      server.send(JSON.stringify({ event: 'sendToPropertyInspector', action: this.action, context: this.context, payload }));
    };

    // 切换状态
    setState = (state: number) => {
      server.send(JSON.stringify({ event: 'setState', context: this.context, payload: { state } }));
    };

    // 设置标题
    setTitle = (title: string) => {
      server.send(JSON.stringify({ event: 'setTitle', context: this.context, payload: { title, target: 0 } }));
    };

    // 设置图片
    setImage = (url: string) => {
      if (url.includes('data:')) {
        server.send(JSON.stringify({ event: 'setImage', context: this.context, payload: { target: 0, image: url } }));
        return;
      }
      const image = new Image();
      image.src = url;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        server.send(JSON.stringify({ event: 'setImage', context: this.context, payload: { target: 0, image: canvas.toDataURL('image/png') } }));
      };
    };

    // 设置图片（二进制直传）：跳过 base64 + JSON 字符串化，图像以原始字节发送。
    // 高频刷新（动画 / 游戏 / 实时仪表）时比 setImage 省 CPU、带宽更小、明显更流畅。
    // 帧协议: [4字节大端 header 长度][JSON header 字节][图片二进制]。
    // imageData 一般来自 canvas.toBlob('image/webp', q)（异步、不阻塞主线程）得到的
    // ArrayBuffer；type 必须与真实字节格式一致（'image/webp' | 'image/png' | 'image/jpeg'）。
    setImageBlob = (imageData: ArrayBuffer, type = 'image/webp') => {
      if (!server || server.readyState !== 1) return;
      // 背压保护：软件消费慢于产出时丢帧，避免发送缓冲无限堆积反而更卡。
      if (server.bufferedAmount > 1 * 1024 * 1024) return;
      const jsonBytes = new TextEncoder().encode(
        JSON.stringify({ event: 'setImage', context: this.context, payload: { type } })
      );
      const headerLen = jsonBytes.length;
      const buffer = new ArrayBuffer(4 + headerLen + imageData.byteLength);
      new DataView(buffer).setUint32(0, headerLen, false); // 大端写入 header 长度
      const u8 = new Uint8Array(buffer);
      u8.set(jsonBytes, 4);
      u8.set(new Uint8Array(imageData), 4 + headerLen);
      server.send(buffer);
    };

    // 设置持久化数据
    setSettings = (payload: any) => {
      this.settings = payload;
      server.send(JSON.stringify({ event: 'setSettings', context: this.context, payload }));
    };

    // 默认浏览器打开
    openUrl = (url: string) => {
      server.send(JSON.stringify({ event: 'openUrl', payload: { url } }));
    };
  }

  return {
    message,
    Interval,
    Unterval,
    ActionArr: Actions.list,
    getAction: Actions.getAction,
    addAction: Actions.addAction,
    delAction: Actions.delAction,
    getActions: Actions.getActions,
    lightControl
  };
});

// !! 请勿更改此处 !!
type MessageTypes = { plugin: StreamDock.PluginMessage; action: StreamDock.ActionMessage };
export const useWatchEvent = <T extends keyof MessageTypes>(type: T, MessageEvents: MessageTypes[T]) => {
  const plugin = usePluginStore();
  if (type === 'plugin') {
    return watch(
      () => plugin.message,
      () => {
        if (!plugin.message) return;
        if (plugin.message.action) return;
        MessageEvents[plugin.message.event]?.(JSON.parse(JSON.stringify(plugin.message)));
      }
    );
  }
  const Events: StreamDock.ActionMessage = {
    willAppear({ action, context, payload }) {
      !plugin.getAction(context) && plugin.addAction(action, context, payload.settings);
    },
    willDisappear({ context }) {
      plugin.delAction(context);
    },
    didReceiveSettings({ context, payload }) {
      const action = plugin.getAction(context);
      action.settings = payload.settings;
    },
    titleParametersDidChange({ context, payload }) {
      const action = plugin.getAction(context);
      action.title = payload.title;
      action.titleParameters = payload.titleParameters;
    }
  };
  return watch(
    () => plugin.message,
    () => {
      if (!plugin.message) return;
      if (plugin.message.action !== MessageEvents['ActionID']) return;
      const data = JSON.parse(JSON.stringify(plugin.message));
      Events[plugin.message.event]?.(data);
      MessageEvents[plugin.message.event]?.(data);
    }
  );
};
