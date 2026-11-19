const path = require('node:path');
const WebSocket = require('ws');
const log = require('log4js').configure({
    appenders: { file: { type: 'file', filename: path.join(path.dirname(process.argv[1]), 'log', 'craft.log') } },
    categories: { default: { appenders: ['file'], level: 'info' } }
}).getLogger();

function readArguments(argv = process.argv.slice(2)) {
    const read = name => {
        const index = argv.indexOf(name);
        return index < 0 ? undefined : argv[index + 1];
    };
    const port = read('-port');
    const uuid = read('-pluginUUID');
    const event = read('-registerEvent');
    if (!port || !uuid || !event) throw new Error('Craft must provide -port, -pluginUUID and -registerEvent');
    return { port, uuid, event, info: JSON.parse(read('-info') || '{}') };
}

class Plugins {
    static globalSettings = {};
    static language = 'en';

    constructor(options = readArguments()) {
        if (Plugins.instance) return Plugins.instance;
        this.info = options.info;
        this.actions = new Map();
        Plugins.language = this.info.application?.language || 'en';
        this.ws = new WebSocket('ws://127.0.0.1:' + options.port);
        this.ws.on('open', () => {
            this.send({ event: options.event, uuid: options.uuid });
            this.getGlobalSettings();
        });
        this.ws.on('error', error => log.error(error));
        this.ws.on('close', () => process.exit(0));
        this.ws.on('message', bytes => {
            try {
                const data = JSON.parse(bytes.toString());
                if (data.event === 'didReceiveGlobalSettings') {
                    Plugins.globalSettings = data.payload.settings;
                    this.didReceiveGlobalSettings?.(data);
                    return;
                }
                const actionId = data.action || this.actions.get(data.context);
                const action = this[actionId?.split('.').pop()];
                if (!action) return;
                if (data.event === 'willAppear') this.actions.set(data.context, data.action);
                if (['willAppear', 'willDisappear', 'didReceiveSettings', 'sendToPlugin'].includes(data.event)) {
                    action[data.event]?.(data);
                }
                if (data.event === 'willDisappear') this.actions.delete(data.context);
            } catch (error) {
                log.error('Craft event failed', error);
            }
        });
        Plugins.instance = this;
    }

    send(message) {
        if (this.ws.readyState !== WebSocket.OPEN) return false;
        this.ws.send(JSON.stringify(message));
        return true;
    }

    setImage(context, image) {
        return this.send({ event: 'setImage', context, payload: { target: 0, image } });
    }

    setImageBlob(context, bytes, type = 'image/webp') {
        if (this.ws.readyState !== WebSocket.OPEN) return false;
        const header = Buffer.from(JSON.stringify({ event: 'setImage', context, payload: { type } }));
        const length = Buffer.alloc(4);
        length.writeUInt32BE(header.length);
        this.ws.send(Buffer.concat([length, header, Buffer.from(bytes)]));
        return true;
    }

    setSettings(context, settings) {
        const { ActionGeometry, ...payload } = settings;
        return this.send({ event: 'setSettings', context, payload });
    }

    getGlobalSettings() {
        return this.send({ event: 'getGlobalSettings' });
    }

    setGlobalSettings(payload) {
        Plugins.globalSettings = payload;
        return this.send({ event: 'setGlobalSettings', payload });
    }

    sendToPropertyInspector(context, payload, action = this.actions.get(context)) {
        return this.send({ event: 'sendToPropertyInspector', action, context, payload });
    }

    openUrl(url) {
        return this.send({ event: 'openUrl', payload: { url } });
    }

    lightControl(payload) {
        return this.send({ event: 'lightControl', payload });
    }
}

class Actions {
    constructor(handlers) {
        this.data = Object.create(null);
        this.default = {};
        Object.assign(this, handlers);
    }

    willAppear(message) {
        this.data[message.context] = { ...structuredClone(this.default), ...message.payload?.settings };
        this._willAppear?.(message);
    }

    didReceiveSettings(message) {
        this.data[message.context] = { ...structuredClone(this.default), ...message.payload?.settings };
        this._didReceiveSettings?.(message);
    }

    willDisappear(message) {
        try {
            this._willDisappear?.(message);
        } finally {
            delete this.data[message.context];
        }
    }
}

module.exports = { Plugins, Actions, log, readArguments };
