# Architecture and Communication Model

## What a Craft plugin is

A Craft plugin is a **Vue 3 single-page app** that the Craft app loads inside an
embedded webview. The same built `index.html` plays **two roles**, decided at
load time by the arguments Craft passes in:

- **Plugin runtime** — the always-on background page. It receives action events
  (`willAppear` / `willDisappear` / `didReceiveSettings`) and draws each widget.
- **Property Inspector (PI)** — the settings form shown when the user edits a
  widget. One PI page per action.

Source project layout (the bundled `assets/plugin-template/`):

```
plugin-template/
├── src/
│   ├── manifest.cjs            # ★ plugin + action declaration (you edit this)
│   ├── main.ts                 # entry: chooses runtime vs PI from argv (do not modify)
│   ├── plugin/
│   │   ├── index.vue           # runtime host: auto-registers every action module
│   │   └── actions/<uuid>.ts   # ★ per-action draw logic
│   ├── pages/
│   │   ├── index.vue           # PI host (naive-ui theme wrapper)
│   │   └── actions/<uuid>.vue  # ★ per-action settings form
│   ├── hooks/                  # framework (do not modify):
│   │   ├── plugin.ts           #   runtime store: WebSocket, action list, Worker timer
│   │   ├── property.ts         #   PI store: WebSocket, settings auto-persist
│   │   ├── qtWebChannel.ts     #   widget X/Y position over QWebChannel (optional)
│   │   └── i18n.ts             # ★ PI label translations
│   ├── components/, types/, assets/
├── public/
│   ├── interval.js             # Web Worker timer (do not modify)
│   ├── qwebchannel.js          # Qt bridge (do not modify)
│   └── images/icon.svg         # plugin/action icon
├── script/
│   ├── autofile.cjs            # generates manifest.json + langs, installs to Craft
│   └── _.html                  # dev wrapper: redirects the webview to the Vite dev server
├── index.html, vite.config.ts, package.json, tsconfig*.json
```

The starred files are the ones you normally edit. Everything in `hooks/`,
`main.ts`, `interval.js`, `qwebchannel.js` is the framework — leave it alone.

## Three roles

| Role | Form | Responsibility |
|------|------|----------------|
| **Craft app** | desktop program | the secondary screen; starts the plugin webview, relays events, renders the images you send |
| **Plugin runtime** | Vue page in a webview | reads each widget's settings, draws a canvas, sends it with `setImage` |
| **Property Inspector** | Vue page in a webview | lets the user configure a widget's `settings` |

The runtime and the PI **cannot talk directly**; Craft relays messages
(`sendToPlugin` / `sendToPropertyInspector`).

## Launch and registration

`main.ts` exposes `window.connectSDSocket(...)`, which Craft calls with five
arguments. It parses them into `window.argv` and mounts either the runtime or
the PI:

```js
window.connectSDSocket = function () {
  window.argv = [arguments[0], arguments[1], arguments[2],
                 JSON.parse(arguments[3]), arguments[4] && JSON.parse(arguments[4])];
  const app = arguments[4] ? createApp(Property) : createApp(Plugin); // PI iff argv[4] present
  app.use(createPinia()).mount('#app');
};
```

`window.argv` layout:

| Index | Meaning |
|-------|---------|
| `argv[0]` | WebSocket port |
| `argv[1]` | this page's registration uuid (also the PI's `context`) |
| `argv[2]` | registration event name |
| `argv[3]` | info object: `application { language, platform, version, font }`, `plugin { uuid, version }` |
| `argv[4]` | **PI only** — action info `{ action, context, payload { settings, coordinates, ... } }`. Absent for the runtime. |

Both stores then open the socket and register:

```js
server = new WebSocket('ws://127.0.0.1:' + window.argv[0]);
server.onopen = () => server.send(JSON.stringify({ event: window.argv[2], uuid: window.argv[1] }));
server.onmessage = (e) => { message.value = JSON.parse(e.data); };
```

> The entry is also aliased as `connectMiraBoxSDSocket` / `connectSocket` /
> `connectElgatoStreamDeckSocket` for compatibility. You never call these — Craft
> does.

## Event-driven model

Everything is a JSON message over the WebSocket. Two directions:

- **Craft → runtime/PI**: `willAppear`, `willDisappear`, `didReceiveSettings`
  (runtime); `didReceiveSettings`, `sendToPropertyInspector` (PI). That is the
  whole received set — see `events.md`.
- **runtime/PI → Craft**: `setImage`, `setSettings`, `sendToPlugin` /
  `sendToPropertyInspector`, `openUrl`.

Typical received message:

```json
{ "event": "didReceiveSettings",
  "action": "com.mirabox.streamdock.demo.action1",
  "context": "<widget instance id>",
  "device": "<device id>",
  "payload": {
    "settings": { "ActionGeometry": { "width": 680, "height": 460 }, "text": "Hi" },
    "coordinates": { "column": 3, "row": 1 },
    "isInMultiAction": false } }
```

## Three core identifiers — don't mix them up

| Identifier | What it is | Used for |
|------------|------------|----------|
| **plugin uuid** | `argv[3].plugin.uuid`, e.g. `com.mirabox.streamdock.demo` | plugin identity; you build `ActionID` from it |
| **action uuid** | `com.mirabox.streamdock.<plugin>.<action>` | action-type identity; its **last segment** is the action file name |
| **context** | opaque string from Craft | "one concrete widget instance on the screen." Dragging the same action on 3 times = 3 contexts |

The runtime stores each `context`'s settings in the `Actions` store
(`plugin.getAction(context).settings`), which is why `context` is the key for
every per-widget operation.

## Framework layer (bundled, usually no need to change)

| File | Provides |
|------|----------|
| `hooks/plugin.ts` | `usePluginStore` (runtime): WebSocket, the `Actions` store, `getAction/addAction/...`, the `Interval/Unterval` Worker timer, and `useWatchEvent('action', ...)` |
| `hooks/property.ts` | `usePropertyStore` (PI): WebSocket, the `settings` ref (auto-persists on change), `sendToPlugin`, `setImage`, `openUrl`, and `useWatchEvent(...)` |
| `hooks/qtWebChannel.ts` | `useQtWebChannelStore`: the widget's X/Y position on the secondary screen, via Qt `QWebChannel` |
| `public/interval.js` | Web Worker that drives `Interval/Unterval` (immune to background-tab throttling) |

API details: see `sdk-api.md`.
