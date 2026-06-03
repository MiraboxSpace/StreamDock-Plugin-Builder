// ============================================================
//  Plugin backend entry — launched by StreamDock as a Node.js child process.
//  This is a "click counter" example. See SKILL.md for how to adapt it.
// ============================================================
const { Plugins, Actions, log } = require('./utils/plugin');

// Create the plugin instance (singleton). The constructor takes no arguments.
const plugin = new Plugins();

// ───────────────── Plugin-level events (optional) ─────────────────
// Global settings received (data shared by all action instances, persisted across devices).
plugin.didReceiveGlobalSettings = ({ payload: { settings } }) => {
    log.info('didReceiveGlobalSettings', settings);
};

// ───────────────── Helpers ─────────────────
// Render a number into an SVG image used as the key background (no image files to bundle).
// IMPORTANT: URL-encode the SVG with encodeURIComponent before putting it in the data URI.
// StreamDock runs ONE URL-decode on the value it receives, so a raw '#', '%', '<' or space
// would be mis-decoded and the key renders blank. With proper encoding, '#' hex colors work
// fine too (rgb(...) / color names are equally fine).
const renderCount = (n) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">
        <rect width="144" height="144" fill="rgb(30,30,46)"/>
        <text x="72" y="92" font-family="Arial" font-size="64" font-weight="bold"
              fill="rgb(255,255,255)" text-anchor="middle">${n}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;
};

// ───────────────── Action: counter ─────────────────
// Key convention: the property name (here, count) must equal the last segment
// of the action UUID. action UUID = com.example.streamdock.counter.count → plugin.count
plugin.count = new Actions({
    // Default settings values; merged with persisted data into this.data[context]
    // when the key first appears.
    default: { count: 0, step: 1 },

    // The key appears on the device: initialize the display with the current count.
    _willAppear({ context }) {
        const { count } = this.data[context];
        plugin.setImage(context, renderCount(count));
    },

    // Press and release the key: count += step → persist → refresh the display.
    keyUp({ context }) {
        const settings = this.data[context];
        settings.count += settings.step;
        plugin.setSettings(context, settings);                // persist
        plugin.setImage(context, renderCount(settings.count));
        plugin.showOk(context);                               // flash a checkmark on the key
    },

    // Message sent from the Property Inspector (PI) via sendToPlugin (here, the "reset" button).
    sendToPlugin({ context, payload }) {
        if (payload && payload.reset) {
            const settings = this.data[context];
            settings.count = 0;
            plugin.setSettings(context, settings);
            plugin.setImage(context, renderCount(0));
        }
    },

    // The PI changed settings and sends back didReceiveSettings: refresh the display.
    _didReceiveSettings({ context }) {
        const { count } = this.data[context];
        plugin.setImage(context, renderCount(count));
    },

    // The key is removed from the device: clean up timers and other resources here.
    _willDisappear({ context }) {
    }
});
