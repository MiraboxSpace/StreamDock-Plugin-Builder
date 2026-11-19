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
| `willAppear` | an action instance appears on the device | `settings`, `coordinates {column,row}`, `controller`, `width`, `height` |
| `willDisappear` | an action instance is removed from the device | same as above |
| `titleParametersDidChange` | the user changed the title or its styling | `title`, `titleParameters`, `width`, `height` |

### Input — standard key

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `keyDown` | the key is pressed | `settings`, `coordinates`, `state`, `userDesiredState`, `width`, `height` |
| `keyUp` | the key is released ("click" usually uses this) | same as above |

These events apply to `Keypad`, including a `Keypad` Control Bar. They are not
emitted for a `Card` action.

### Input — card (`Card`)

| Device | Event | Key payload fields |
| --- | --- | --- |
| Mira75 Card | `touchTap` | `controller: "Card"`, `settings`, `coordinates`, `width`, `height`, `tapPos: [x,y]`, `hold`, `resources` (reserved) |
| Other Card devices | `touchEvent` | `controller: "Card"`, `settings`, `width`, `height`, `phase`, `touchId`, `position`, `startPosition`, `delta` |

`controller: "Card"` alone does not determine which touch protocol is used.
A cross-device card should implement both bare handlers.

`touchTap` is one complete tap result. No down/up pairing is required.
`hold` distinguishes a long press. It does not provide a drag phase stream.

`touchEvent.phase` is `down`, `move`, `up` or `cancel`.
Track gestures per context and touchId. The initial Label retains capture:
position can go negative or exceed the Label bounds. On cancel, discard
pressed/drag state without activating a click. Every phase includes settings,
controller, width and height; position/startPosition/delta are Label-local.
Finish release actions only on up, not on every phase.

Both protocols use the actual `payload.width / height` for drawing and
coordinate mapping. Do not use a square canvas or settings-based dimensions.

Source: [StreamDock Wiki received events](https://ai.mirabox.net:20001/wiki/wiki-e7gidk72/page/page-16aa5601-444b-4b69-9507-b428baac3577),
touchTap/touchEvent sections, checked 2026-11-19 (version 36).

### Input — dial / touchscreen (Knob)

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `dialDown` | the dial is pressed | `settings`, `controller` |
| `dialUp` | the dial is released | same as above |
| `dialRotate` | the dial is rotated | `ticks` (positive = clockwise, negative = counter-clockwise), `pressed` (whether held while rotating) |
| `touchTap` | N4 Pro screen above the dial, on firmware that emits tap events | `controller: "Knob"`, `tapPos [x,y]`, `hold` (whether a long press) |

For N4 Pro, keep the existing dialDown/dialUp handlers and add a bare
touchTap handler for the screen. Older firmware already reports ordinary
dialDown/dialUp for screen presses, so those existing handlers cover it.
Do not add firmware-version detection, a separate old-firmware fallback,
or synthesize extra dial events from touchTap. If tap and dial release should
perform the same operation, call a shared action method from both handlers.
For actions supporting both Card and Knob, dispatch touchTap by controller;
a Card-only guard would ignore the N4 Pro screen.

### Settings

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `didReceiveSettings` | this action instance's settings changed | `settings`, `coordinates`, `controller` (`"Card"` for a card), `width`, `height` |
| `didReceiveGlobalSettings` | global settings changed / after an explicit `getGlobalSettings` | `settings` |

### SDKVersion 3 drawing dimensions

`payload.width` and `payload.height` are the actual drawable pixel dimensions.
They accompany `willAppear`, `willDisappear`, `didReceiveSettings`,
`keyDown`, `keyUp` and `titleParametersDidChange`. They are direct payload
members, not fields inside settings.

For cards (`payload.controller === "Card"`), Control Bars (`Keypad`) and
regular keys, draw at the supplied dimensions and refresh the image when
they change. Do not infer a square key or use a fixed bar height.
Store the latest valid pair per context for events without dimensions
(such as a PI reset message) and timed redraws; clear it on disappearance.

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
