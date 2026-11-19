# Event reference

All communication is JSON over the WebSocket. Craft's event surface is **much
smaller** than StreamDock's — there are no input, title, state, device, app, or
system events. The tables below are the complete set.

---

## 1. Events the plugin runtime receives (per action)

Handled in `useWatchEvent('action', { ActionID, ... })` inside
`src/plugin/actions/<uuid>.ts`. Common fields: `event`, `action`, `context`,
`device`, `payload`.

| Event | Fires when | Key payload fields |
|-------|------------|--------------------|
| `willAppear` | a widget instance appears on the secondary screen | `settings`, `coordinates {column,row}`, `isInMultiAction` |
| `willDisappear` | a widget instance is removed from the screen | `settings`, `coordinates` |
| `didReceiveSettings` | this widget's settings changed — **PI edit OR on-screen resize** | `settings` (incl. the possibly-new `ActionGeometry`), `coordinates` |

That is the entire list. The framework's `useWatchEvent` maintains the action
store for `willAppear` / `willDisappear` / `didReceiveSettings` automatically,
then calls your handler.

> **There is no `willAppear`-without-settings problem and no separate "settings
> at startup" event.** `willAppear.payload.settings` already carries the initial
> settings (including `ActionGeometry`); later changes arrive via
> `didReceiveSettings`.

### `didReceiveSettings` payload (the important one)

```json
{ "action": "com.mirabox.streamdock.demo.action1",
  "event": "didReceiveSettings",
  "context": "<widget id>",
  "device": "<device id>",
  "payload": {
    "settings": { "ActionGeometry": { "width": 680, "height": 460 }, "...": "..." },
    "coordinates": { "column": 3, "row": 1 },
    "isInMultiAction": false } }
```

Two distinct causes, handled the same way (redraw):

1. The user edited a field in the Property Inspector.
2. The user **resized the widget** on the secondary screen → `ActionGeometry`
   now holds the new `width`/`height`. Redraw at that size and the widget scales.

> **The Property Inspector ALSO receives `didReceiveSettings`, including once on
> its first load** — not only after a backend `setSettings`. That first event
> carries the widget's current stored settings (e.g. the on-screen `x`/`y`
> position Craft manages), so it is the reliable place for the PI to **initialize
> form fields from settings**. Seeding in `onMounted` shows stale/`0` values
> because the live settings have not arrived yet. See `property-inspector.md`.

---

## 2. Events the plugin runtime sends

The runtime store (`plugin.getAction(context)`) wraps these. Raw JSON shown for
reference.

| Event | Purpose | JSON |
|-------|---------|------|
| `setImage` | show an image on the widget (**the main output**) | `{event,context,payload:{target:0,image}}` |
| `setSettings` | persist this widget's settings | `{event,context,payload:{...}}` |
| `sendToPropertyInspector` | send data to the open PI | `{event,action,context,payload}` |
| `openUrl` | open a URL in the default browser | `{event,payload:{url}}` |
| `lightControl` | show/hide a screen-level warning effect | `{event:"lightControl",payload:{active,...}}` |

`image` is a dataURL (`data:image/png;base64,...` from `canvas.toDataURL()`, or
an SVG dataURL). `target` is fixed at `0`.

> **High-frequency rendering?** `setImage`'s dataURL path encodes base64 on the
> main thread and inflates the payload. For animation / games / live gauges,
> send the frame as **raw bytes** via `setImageBlob` instead — same `setImage`
> event, but framed in binary as `[4-byte big-endian header length][JSON
> header][image bytes]`. See "Binary image push" in `sdk-api.md`.

> **`setSettings` cannot change `ActionGeometry`.** Every other settings key is
> writable. To change the widget's size, draw a canvas of the new size and send
> it with `setImage` — Craft reads the new image dimensions and updates
> `ActionGeometry` itself (you will then receive a `didReceiveSettings`).

> **`setTitle` / `setState` exist as dead methods in the template store but do
> nothing on Craft** — Craft has no titles or states. Do not use them. Draw text
> on the canvas instead.

### Screen light effect: `lightControl`

Use `plugin.lightControl(payload)` to control the effect overlay. It is global
to the screen rather than scoped to a widget `context`, so the JSON has no
`context` field:

```json
{
  "event": "lightControl",
  "payload": {
    "active": true,
    "effectStyle": "glow",
    "alarmColor": "#ff5500",
    "effectRect": null,
    "effectOpacity": 0.8,
    "tintOpacity": 0.08,
    "glowWidth": 40,
    "diffusion": 0.7,
    "borderWidth": 2,
    "cornerRadius": 12,
    "pulseEnabled": true,
    "pulseDuration": 900,
    "minimumIntensity": 0.3
  }
}
```

| Field | Type / range | Meaning |
|-------|--------------|---------|
| `active` | boolean, required | `true` shows the effect; `false` hides it |
| `effectStyle` | `glow` \| `corners` \| `scan` \| `ripple` \| `stripes` | breathing glow, corner warning, vertical scan, expanding ripple, or moving diagonal stripes |
| `alarmColor` | QML color string | Prefer `#RRGGBB` or `#AARRGGBB` |
| `effectRect` | `null` or `{x,y,width,height}` | `null` fills `AlarmOverlay`; coordinates are relative to its top-left; width/height must be >= 0 logical pixels |
| `effectOpacity` | number 0–1 | opacity of the complete effect |
| `tintOpacity` | number 0–1 | opacity of the inner color tint |
| `glowWidth` | number >= 0 | logical pixels; rendering clamps to half the effect area's short side |
| `diffusion` | number 0–1 | 0 concentrates at the edge; 1 spreads more evenly |
| `borderWidth` | number >= 0 | logical pixels; rendering clamps to half the short side |
| `cornerRadius` | number >= 0 | logical pixels; rendering clamps to half the short side |
| `pulseEnabled` | boolean | enables the breathing animation |
| `pulseDuration` | integer >= 1 | milliseconds for one fade direction; a full cycle is about twice this |
| `minimumIntensity` | number 0–1 | lowest intensity during breathing |

For threshold-based monitoring, emit only when the alarm state changes:

```ts
let alarming = false;

function updateAlarm(value: number, threshold: number) {
  const next = value >= threshold;
  if (next === alarming) return;
  alarming = next;
  plugin.lightControl(next
    ? { active: true, effectStyle: 'glow', alarmColor: '#ff5500' }
    : { active: false });
}

// If this widget owns the alarm:
willDisappear() {
  if (alarming) plugin.lightControl({ active: false });
  alarming = false;
}
```

Because the overlay is global, multiple widgets can otherwise fight over its
state. A plugin with multiple alarm sources should centralize ownership or keep
an active-source count and turn the effect off only when none remain.

---

## 3. Events the Property Inspector sends and receives

**The PI receives** (handled in `useWatchEvent({ ... })` inside the `.vue` page):

| Event | Description |
|-------|-------------|
| `didReceiveSettings` | this widget's settings (the framework also re-syncs `property.settings`) |
| `sendToPropertyInspector` | data pushed from the plugin runtime |

**The PI sends** (wrapped by the framework):

| Event | Purpose |
|-------|---------|
| `setSettings` | persist settings — fires automatically when you assign to `property.settings.*` (debounced), no manual call |
| `sendToPlugin` | send data to the plugin runtime |
| `setImage` | draw on the widget directly from the PI (rarely needed) |
| `openUrl` | open a URL |

---

## Events that do NOT exist on Craft

Do not write handlers for any of these — they never fire:

`keyDown` · `keyUp` · `dialDown` · `dialUp` · `dialRotate` · `touchTap` ·
`titleParametersDidChange` · `propertyInspectorDidAppear` /
`propertyInspectorDidDisappear` · `deviceDidConnect` / `deviceDidDisconnect` ·
`applicationDidLaunch` / `applicationDidTerminate` · `systemDidWakeUp` ·
`didReceiveGlobalSettings`.

---

## Image format notes

`setImage`'s `image` accepts:

- **Canvas PNG dataURL (recommended):** `canvas.toDataURL()` →
  `data:image/png;base64,...`. Draw at the `ActionGeometry` size.
- **SVG dataURL:** `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`.

Because the runtime is a real Chromium webview, full HTML5 canvas is available
(gradients, shadows, `drawImage`, fonts, compositing) — there is **no** SVG
Tiny subset restriction like StreamDock. Prefer canvas.
