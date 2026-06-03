# SDK API reference (template-bundled wrapper)

The template bundles a wrapper layer. **You usually do not need to change those
files** — just write business code against the usage shown below.

---

## Backend: `plugin/utils/plugin.js`

`require('./utils/plugin')` exports 4 things:

```js
const { Plugins, Actions, log, EventEmitter } = require('./utils/plugin');
```

### The Plugins class

A singleton. `const plugin = new Plugins();` connects to the app automatically.
(The constructor takes no arguments; an argument in old examples like
`new Plugins('xxx')` is ignored.)

**Send methods** (the first argument is usually `context`):

| Method | Purpose |
|--------|---------|
| `plugin.setTitle(context, str, row=0, num=6)` | set the title. When `row>0`, wraps automatically at `num` chars/line and appends `..` on overflow |
| `plugin.setImage(context, url)` | set the key icon; `url` is a base64 or svg dataURL |
| `plugin.setState(context, state)` | switch a multi-state action's state (0,1,...) |
| `plugin.setSettings(context, payload)` | persist this key instance's data |
| `plugin.showOk(context)` | flash a "✓" on the key |
| `plugin.showAlert(context)` | flash a "⚠" on the key |
| `plugin.setGlobalSettings(payload)` | persist global data |
| `plugin.getGlobalSettings()` | request global data (result arrives via `didReceiveGlobalSettings`) |
| `plugin.sendToPropertyInspector(payload)` | send data to the currently open PI |
| `plugin.openUrl(url)` | open a URL in the default browser |

**Static properties:**

| Property | Meaning |
|----------|---------|
| `Plugins.language` | the current app language, e.g. `"zh_CN"` |
| `Plugins.globalSettings` | the most recently received global settings |

**Plugin-level events**: attach a same-named function directly on `plugin` to
receive events that have no `action` field:

```js
plugin.didReceiveGlobalSettings = ({ payload: { settings } }) => { /* ... */ };
plugin.deviceDidConnect = (data) => { /* ... */ };
plugin.systemDidWakeUp = (data) => { /* ... */ };
```

### The Actions class

Represents one action (one kind of key). **The property name it is attached to
on `plugin` must equal the last segment of the action UUID.**

```js
// UUID = com.acme.streamdock.timer.start  →  property name start
plugin.start = new Actions({
    default: { /* default settings values */ },
    _willAppear({ context, payload }) {},
    keyUp({ context, payload }) {},
    // ...
});
```

**`this.data[context]`**: the settings of each key instance. Both `_willAppear`
and `didReceiveSettings` reset it to the merge of `default` and the received
`settings` (`{...default, ...settings}`).

> Meaning: `this.data[context]` holds **user configuration only**. Keep runtime
> transient state (timers, remaining countdown seconds, etc.) in module-level
> variables (e.g. `const timers = {}` keyed by `context`), not in
> `this.data[context]` — otherwise it is overwritten when `didReceiveSettings`
> arrives.

**Event-handler naming rule (important):**

| Use the `_` prefix (SDK intercepts, then forwards) | Use the bare name (forwarded directly) |
|------|------|
| `_willAppear` | `keyDown` `keyUp` |
| `_willDisappear` | `dialDown` `dialUp` `dialRotate` `touchTap` |
| `_didReceiveSettings` | `sendToPlugin` |
| `_propertyInspectorDidAppear` | `propertyInspectorDidDisappear` `titleParametersDidChange` |

Reason: the `Actions` class itself defines four methods —
`willAppear/willDisappear/didReceiveSettings/propertyInspectorDidAppear` — to
maintain `this.data`. Defining a method with one of those names **directly**
overrides them and breaks `this.data`. So use the `_`-prefixed version for
those 4, and the bare name for every other event.

The `data` each handler receives looks like
`{ event, action, context, payload }`; the common destructuring is
`({ context, payload })`, and `payload.settings` is the current settings.

### log

A `log4js` logger that writes to `plugin/log/<date>.log`:

```js
log.info('msg', obj);   log.error('err', e);   log.warn(...);
```

### EventEmitter

A simple pub/sub: `subscribe(event, fn)` / `unsubscribe(event, fn)` /
`emit(event, data)`.

---

## Front-end (Property Inspector)

The PI's HTML loads `common.js → action.js → axios.js → index.js` in that fixed
order. You only write `index.js` (and `index.html`).

### Global variables (provided by `action.js`)

| Variable | Meaning |
|----------|---------|
| `$websocket` | the WebSocket to the app |
| `$uuid` | this PI's UUID |
| `$action` | the UUID of the owning action |
| `$context` | the context of the key instance being configured |
| `$settings` | the settings proxy object — **assigning to it auto-persists** (debounced) |
| `$lang` | the Localization object for the current language |

### Methods on `$websocket` (provided by `action.js`)

| Method | Purpose |
|--------|---------|
| `$websocket.sendToPlugin(payload)` | send data to the plugin backend |
| `$websocket.setTitle(str, row, num)` | set the key title |
| `$websocket.setImage(url)` | set the key icon (converted to PNG automatically) |
| `$websocket.setState(state)` | switch the state |
| `$websocket.openUrl(url)` | open a URL |
| `$websocket.setGlobalSettings(payload)` / `getGlobalSettings()` | global settings |

### Persisting settings: `$settings`

```js
$settings.volume = 50;      // auto-saved (debounced); the backend receives didReceiveSettings
```

Do not store settings with a raw `$websocket.send` — just use `$settings`.

### Receiving events: `$propEvent`

Define a `$propEvent` object in `index.js`; events from the app are routed into
it by `event` name:

```js
const $propEvent = {
    didReceiveSettings({ settings }) { /* echo into the form */ },
    didReceiveGlobalSettings({ settings }) {},
    sendToPropertyInspector(payload) { /* data from the backend */ }
};
```

### DOM helper: `$()` (provided by `common.js`)

```js
$('#id')                 // get a single element (throws if not found); has .on()/.attr() methods
$('.cls', true)          // get many, returns an array
$('#btn').on('click', fn)
```

Also: `$.debounce(fn, delay)`, `$.throttle(fn, delay)`, and the `$emit` event
bus (`$emit.on(name,fn)` / `$emit.send(name,data)`).

### File picker

When an `<input type="file" id="logo">` is clicked, the path returned by the
app triggers `$emit.send('File-logo', data)`:

```js
$emit.on('File-logo', (data) => { /* data is the chosen-file info */ });
```

An `<input type="num">` is automatically restricted to digits by `common.js`.
