# Event reference

All communication is JSON messages. Two directions: **received events**
(app → plugin/PI) and **sent events** (plugin/PI → app).

---

## 1. Events the plugin backend receives

The backend receives them through the template's `Actions`/`Plugins` (see
`sdk-api.md`). Below are the raw event names and the key payload fields. Common
fields on every event: `event`; most also have `action` and `context`.

### Lifecycle

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `willAppear` | an action instance appears on the device | `settings`, `coordinates {column,row}`, `controller` |
| `willDisappear` | an action instance is removed from the device | same as above |
| `titleParametersDidChange` | the user changed the title or its styling | `title`, `titleParameters` |

### Input — standard key

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `keyDown` | the key is pressed | `settings`, `coordinates`, `state`, `userDesiredState` |
| `keyUp` | the key is released ("click" usually uses this) | same as above |

### Input — dial / touchscreen (Knob/Encoder)

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `dialDown` | the dial is pressed | `settings`, `controller` |
| `dialUp` | the dial is released | same as above |
| `dialRotate` | the dial is rotated | `ticks` (positive = clockwise, negative = counter-clockwise), `pressed` (whether held while rotating) |
| `touchTap` | the small screen above the dial is tapped | `tapPos [x,y]`, `hold` (whether a long press) |

### Settings

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `didReceiveSettings` | this action instance's settings changed | `settings`, `coordinates` |
| `didReceiveGlobalSettings` | global settings changed / after an explicit `getGlobalSettings` | `settings` |

### Property Inspector related

| Event | Fires when | payload |
|-------|------------|---------|
| `propertyInspectorDidAppear` | the user opened an action's settings page | — |
| `propertyInspectorDidDisappear` | the settings page closed | — |
| `sendToPlugin` | the PI sent data via `sendToPlugin` | custom JSON |

### Device / system

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `deviceDidConnect` | a device is connected | `deviceInfo {name,type,size}` |
| `deviceDidDisconnect` | a device is removed | — |
| `applicationDidLaunch` | a monitored app launches | `payload.application` |
| `applicationDidTerminate` | a monitored app exits | `payload.application` |
| `systemDidWakeUp` | the computer wakes up | — |

---

## 2. Events the plugin backend sends

The template's `Plugins` instance already wraps these as methods (see
`sdk-api.md`); the raw JSON is below.

| Event | Purpose | JSON |
|-------|---------|------|
| `setTitle` | change the key title | `{event,context,payload:{title,target,state}}` |
| `setImage` | change the key icon | `{event,context,payload:{image,target,state}}` |
| `setState` | switch a multi-state action's state | `{event,context,payload:{state}}` |
| `showAlert` | flash a "⚠" on the key | `{event,context}` |
| `showOk` | flash a "✓" on the key | `{event,context}` |
| `setSettings` | persist this action instance's data | `{event,context,payload:{...}}` |
| `getSettings` | request this action instance's data | `{event,context}` |
| `setGlobalSettings` | persist global data | `{event,context,payload:{...}}` |
| `getGlobalSettings` | request global data | `{event,context}` |
| `sendToPropertyInspector` | send data to the PI | `{event,action,context,payload:{...}}` |
| `openUrl` | open a URL in the default browser | `{event,payload:{url}}` |
| `logMessage` | write a debug log line | `{event,payload:{message}}` |

`target` values: `0` = app + hardware, `1` = hardware only, `2` = app only.
`state` is the target state index of a multi-state action.

> **Protocol events ≠ wrapped methods.** The table above lists StreamDock
> protocol-level events. The template's `Plugins` class wraps most of them as
> same-named methods (see `sdk-api.md`), but does **not** wrap
> `getSettings`/`logMessage`. `getSettings` is rarely needed — `willAppear`
> already carries `payload.settings`, and later changes arrive via
> `didReceiveSettings`. If you really need it, send it yourself:
> `plugin.ws.send(JSON.stringify({ event: 'getSettings', context }))`.

---

## 3. Events the Property Inspector sends and receives

**The PI receives** (handled in `$propEvent` inside `index.js`):

| Event | Description |
|-------|-------------|
| `didReceiveSettings` | this action instance's settings |
| `didReceiveGlobalSettings` | global settings |
| `sendToPropertyInspector` | data sent from the plugin backend |

**The PI sends** (already wrapped onto `$websocket` / `$settings` by the
template):

| Event | Purpose |
|-------|---------|
| `setSettings` | persist settings (triggered automatically when you assign to `$settings.x`, no manual call needed) |
| `setGlobalSettings` / `getGlobalSettings` | global settings |
| `sendToPlugin` | send data to the plugin backend |
| `setTitle` / `setImage` / `setState` | change the key appearance directly |
| `openUrl` | open a URL |

---

## Image format notes

`setImage`'s `image` accepts:

- Base64 dataURL: `data:image/png;base64,...`
- SVG dataURL: `` data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)} ``
  (recommended — no image file to bundle). URL-encode the SVG: StreamDock runs
  one URL-decode on the value it receives.

The key canvas is about 144×144 pixels.
