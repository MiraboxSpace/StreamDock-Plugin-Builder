let $websocket, $uuid, $action, $context, $settings;
const $propEvent = {};
let saveTimer;

function syncSettings(settings) {
    clearTimeout(saveTimer);
    $settings = new Proxy({ ...settings }, {
        set(target, property, value) {
            if (property === 'ActionGeometry') return true;
            target[property] = value;
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                const { ActionGeometry, ...payload } = target;
                $websocket.send(JSON.stringify({ event: 'setSettings', context: $uuid, payload }));
            }, 150);
            return true;
        }
    });
    $propEvent.didReceiveSettings?.({ settings: $settings });
}

window.connectMiraBoxSDSocket = function (port, uuid, event, app, actionInfo) {
    const info = JSON.parse(actionInfo);
    $uuid = uuid;
    $action = info.action;
    $context = info.context;
    window.qtWebChannel?.init();
    $websocket = new WebSocket('ws://127.0.0.1:' + port);
    $websocket.onopen = () => {
        $websocket.send(JSON.stringify({ event, uuid }));
        $propEvent.connected?.(JSON.parse(app));
        syncSettings(info.payload?.settings || {});
    };
    $websocket.onmessage = message => {
        const data = JSON.parse(message.data);
        if (data.event === 'didReceiveSettings') syncSettings(data.payload.settings);
        else $propEvent[data.event]?.(data.payload);
    };
    $websocket.onclose = () => clearTimeout(saveTimer);
    $websocket.sendToPlugin = payload => $websocket.send(JSON.stringify({
        event: 'sendToPlugin', action: $action, context: $uuid, payload
    }));
    $websocket.getGlobalSettings = () => $websocket.send(JSON.stringify({ event: 'getGlobalSettings' }));
    $websocket.setGlobalSettings = payload => $websocket.send(JSON.stringify({ event: 'setGlobalSettings', payload }));
    $websocket.openUrl = url => $websocket.send(JSON.stringify({ event: 'openUrl', payload: { url } }));
};

window.connectSDSocket = window.connectMiraBoxSDSocket;
window.connectSocket = window.connectMiraBoxSDSocket;
window.connectElgatoStreamDeckSocket = window.connectMiraBoxSDSocket;
