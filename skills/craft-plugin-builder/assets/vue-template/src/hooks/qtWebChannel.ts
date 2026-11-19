import { defineStore } from 'pinia';
import QWebChannel from '../../public/qwebchannel.js'
// 插件钩子
export const useQtWebChannelStore = defineStore('qtWebChannel', () => {

    const qtObject = ref();
    const x = ref(0);
    const y = ref(0);
    const flag = ref(true);

    new QWebChannel(qt.webChannelTransport, function (channel: any) {
        qtObject.value = channel.objects.channelqtObject;
        qtObject.value.sigDidReceiveCoordinate.connect((xx: number, yy: number) => {
            x.value = Math.round(xx);
            y.value = Math.round(yy);
            flag.value = true;
            // console.log(xx, yy);
        })
    });

    const handleKeydown = (event) => {

        // 判断当前焦点是否是输入框
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");

        // 如果输入框获取了焦点或者没有返回值，直接返回
        if (isInputFocused || !flag.value) {
            return;
        }
        flag.value = false;

        switch (event.key) {
            case "ArrowUp":
                y.value -= 1;
                event.preventDefault();
                break;
            case "ArrowDown":
                y.value += 1;
                event.preventDefault();
                break;
            case "ArrowLeft":
                x.value -= 1;
                event.preventDefault();
                break;
            case "ArrowRight":
                x.value += 1;
                event.preventDefault();
                break;
        }
        qtObject.value.uDidReceiveCoordinate(x.value, y.value)
    }

    return {
        qtObject,
        x,
        y,
        handleKeydown
    }
})
