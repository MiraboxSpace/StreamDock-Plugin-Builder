import { usePluginStore, useWatchEvent } from '@/hooks/plugin';

// ── One Craft action = draw a canvas → setImage ────────────────────────────
// The whole job of a Craft action is: read this instance's `settings`, draw a
// canvas the size of `settings.ActionGeometry`, and push it with setImage.
//
//   `name` is the file name (= the action UUID's last segment, e.g. "action1").
//   It is injected by src/plugin/index.vue when it auto-registers this module.

interface Settings {
  ActionGeometry?: { width: number; height: number };
  text?: string;
  bgColor?: string;
  textColor?: string;
}

export default function (name: string) {
  // Full action id, e.g. com.mirabox.streamdock.demo.action1
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();

  useWatchEvent('action', {
    ActionID,
    // Instance shown on the secondary screen for the first time.
    willAppear({ context, payload }) {
      plugin.getAction(context)!.setSettings(payload.settings);
      start(context);
    },
    // Instance removed — always stop its timer.
    willDisappear({ context }) {
      plugin.Unterval(ActionID + context);
    },
    // Settings changed. Two causes, handled the same way — just redraw:
    //   1. the user edited a field in the Property Inspector;
    //   2. the user resized the widget on screen → payload carries a NEW
    //      ActionGeometry, so the next draw simply uses the new width/height.
    didReceiveSettings({ context }) {
      plugin.Unterval(ActionID + context);
      start(context);
    }
  });

  // Draw now, then keep a live clock ticking. Use plugin.Interval (a Web Worker
  // timer) instead of setInterval so it keeps firing when the webview is in the
  // background. Key the timer by ActionID+context so each instance is independent.
  const start = (context: string) => {
    draw(context);
    plugin.Interval(ActionID + context, 1000, () => draw(context));
  };

  const draw = (context: string) => {
    const s = (plugin.getAction(context)?.settings ?? {}) as Settings;

    // Always draw at the size Craft asks for. Resizing on screen feeds a new
    // ActionGeometry here; drawing a different-sized canvas would instead push
    // a new size back to Craft (that is the only way to change the geometry —
    // setSettings cannot change ActionGeometry).
    const W = Number(s.ActionGeometry?.width) || 680;
    const H = Number(s.ActionGeometry?.height) || 460;

    const cvs = document.createElement('canvas');
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext('2d')!;

    // Rounded background.
    const r = Math.min(W, H) * 0.06;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(W, 0, W, H, r);
    ctx.arcTo(W, H, 0, H, r);
    ctx.arcTo(0, H, 0, 0, r);
    ctx.arcTo(0, 0, W, 0, r);
    ctx.closePath();
    ctx.fillStyle = s.bgColor || '#10131a';
    ctx.fill();

    // User text.
    ctx.fillStyle = s.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(H * 0.18)}px Arial`;
    ctx.fillText(s.text || 'Hello Craft', W / 2, H * 0.4);

    // Live clock (shows the redraw loop working).
    ctx.font = `${Math.round(H * 0.12)}px Arial`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(new Date().toLocaleTimeString(), W / 2, H * 0.68);
    ctx.globalAlpha = 1;

    // Push the frame to Craft.
    plugin.getAction(context)!.setImage(cvs.toDataURL());
  };
}
