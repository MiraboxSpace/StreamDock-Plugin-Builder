# SDK API reference (template framework)

The template bundles the framework in `src/hooks/`. **You usually do not change
those files** — write business code against the API below.

---

## Runtime: `usePluginStore()` (`src/hooks/plugin.ts`)

```ts
import { usePluginStore, useWatchEvent } from '@/hooks/plugin';
const plugin = usePluginStore();
```

### Screen light effect: `plugin.lightControl(payload)`

Sends the global `lightControl` event to show or hide a warning effect over the
Craft screen. This is a store-level method, not an action-instance method:

```ts
plugin.lightControl({
  active: true,
  effectStyle: 'glow',
  alarmColor: '#ff5500',
  effectOpacity: 0.8,
  pulseEnabled: true
});

plugin.lightControl({ active: false });
```

Use it for exceptional states such as CPU load or temperature crossing a
threshold. Send only on state transitions, and ensure the owner turns the
effect off when the condition clears or its widget disappears. See
`events.md` for the complete payload contract.

### The action store

Each widget instance is an `Actions` object, keyed by `context`. The store is
maintained for you by the framework's `useWatchEvent` (on `willAppear` it adds,
on `willDisappear` it deletes, on `didReceiveSettings` it updates `.settings`).

| Call | Returns / does |
|------|----------------|
| `plugin.getAction(context)` | the `Actions` instance for this widget (`.settings`, methods below) |
| `plugin.getActions(action)` | all instances of one action uuid |
| `plugin.addAction(action, context, settings)` | add (framework does this on `willAppear`) |
| `plugin.delAction(context)` | remove (framework does this on `willDisappear`) |

### Methods on an action instance (`plugin.getAction(context)`)

| Method | Purpose |
|--------|---------|
| `.setImage(url)` | **the main output.** Show an image on the widget. `url` is a dataURL — pass `canvas.toDataURL()` (or an SVG dataURL). A non-data URL is loaded, drawn to a canvas, and re-encoded automatically. |
| `.setImageBlob(imageData, type?)` | **binary fast path for high-frequency rendering** (animation / games / live gauges). Sends raw image bytes over the socket — no base64, no JSON body. `imageData` is an `ArrayBuffer`; `type` defaults to `'image/webp'`. See "Binary image push" below. |
| `.setSettings(payload)` | persist this widget's settings (updates `.settings` and sends to Craft). **Cannot change `ActionGeometry`** — see `events.md`. |
| `.sendToPropertyInspector(payload)` | push data to the open PI |
| `.openUrl(url)` | open a URL in the default browser |
| `.settings` | the current settings object (includes `ActionGeometry`) |

> `.setTitle` and `.setState` also exist on the instance but **do nothing on
> Craft** — there are no titles or states. Ignore them; draw on the canvas.

### Binary image push: `.setImageBlob(imageData, type?)`

`setImage` is fine for occasional updates, but for anything that repaints many
times per second (a game, an animation, a live gauge) it becomes the
bottleneck: `canvas.toDataURL()` runs **synchronously on the main thread** and
base64-encodes the frame, and the resulting string is then wrapped in JSON —
~33% bigger than the raw bytes. The combination causes visible jank.

`setImageBlob` sends the **raw image bytes** instead, framed as:

```
[ 4-byte big-endian header length ][ JSON header bytes ][ image binary ]
```

The JSON header is `{ event:'setImage', context, payload:{ type } }`; Craft
reads the length prefix, parses the header, and decodes the trailing bytes as an
image of `type`. Pair it with `canvas.toBlob('image/webp', q)` — `toBlob`
encodes **off the main thread** and WebP is small and keeps an alpha channel
(so transparent widgets work; the JPEG path could not do transparency).

```ts
function push(context: string, cvs: HTMLCanvasElement) {
  cvs.toBlob(
    (blob) => {
      if (!blob) return;
      blob.arrayBuffer().then((buf) =>
        plugin.getAction(context)?.setImageBlob(buf, 'image/webp')
      );
    },
    'image/webp',
    0.85                       // quality 0–1: higher = sharper + larger
  );
}
```

Notes:
- **`type` must match the real bytes.** Default is `'image/webp'`; if your Craft
  build renders blank keys with WebP, re-encode as `'image/png'` and pass that.
- The method has **built-in back-pressure**: if the socket's `bufferedAmount`
  exceeds ~1 MB it drops the frame, so a slow consumer can't make the backlog
  grow without bound. For an even cheaper loop, also skip the `toBlob` encode
  when backed up (guard the call site), so you don't pay the encode for a frame
  you'd drop anyway.
- Only one encode should be in flight per widget — guard with a small flag so
  slow encodes can't queue up behind your render loop.

### Worker timer: `Interval` / `Unterval`

Use these instead of `setInterval` / `clearInterval`. They run on a Web Worker
(`public/interval.js`), so they keep firing when the Craft webview is in the
background (native timers get throttled).

```ts
plugin.Interval(uuid, delayMs, fn);   // start/replace a timer
plugin.Unterval(uuid);                // stop it
```

`uuid` is any unique string — convention is `ActionID + context` so each widget
instance has its own timer. **Always `Unterval` in `willDisappear`.**

### Subscribing to action events: `useWatchEvent('action', ...)`

```ts
export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;  // e.g. com.mirabox.streamdock.demo.action1
  const plugin = usePluginStore();

  useWatchEvent('action', {
    ActionID,                                   // REQUIRED: routes events to this action
    willAppear({ context, payload }) { /* draw */ },
    willDisappear({ context }) { plugin.Unterval(ActionID + context); },
    didReceiveSettings({ context, payload }) { /* redraw */ }
  });
}
```

- `name` is the action file name, injected by `src/plugin/index.vue` when it
  auto-registers every `@/plugin/actions/*.ts`. It must equal the action uuid's
  last segment.
- The `ActionID` key filters incoming messages to this action.
- Each handler receives `{ event, action, context, device, payload }`;
  `payload.settings` is the current settings.

---

## Property Inspector: `usePropertyStore()` (`src/hooks/property.ts`)

```ts
import { usePropertyStore, useWatchEvent } from '@/hooks/property';
const property = usePropertyStore();
```

### `property.settings` — the auto-persisting form model

```ts
property.settings.text = 'Hi';   // auto-saved (debounced) → Craft → runtime gets didReceiveSettings
```

`property.settings` is a reactive ref seeded from `argv[4].payload.settings`. A
`watch(..., { deep: true })` in the framework sends `setSettings` on **any**
change. Bind form controls with `v-model="property.settings.xxx"` — no manual
save call.

> The framework's watch also stamps `settings.softwareSend = false` on each
> outgoing save (a marker meaning "this change came from the PI, not the
> software") and clamps a couple of legacy size fields. Leave it; it is
> harmless if you do not use those keys.

### Other PI methods

| Method | Purpose |
|--------|---------|
| `property.sendToPlugin(payload)` | send data to the plugin runtime |
| `property.setImage(url)` | draw on the widget directly (rarely needed) |
| `property.openUrl(url)` | open a URL |

### Receiving events: `useWatchEvent({ ... })`

```ts
useWatchEvent({
  didReceiveSettings(data) { /* settings re-synced; react if needed */ },
  sendToPropertyInspector(data) { /* data from the runtime */ }
});
```

The framework already re-syncs `property.settings` on `didReceiveSettings` (with
a `preventWatch` guard so the echo does not loop). You only add a handler when
you need to react to it.

---

## Widget position: `useQtWebChannelStore()` (`src/hooks/qtWebChannel.ts`)

Optional. Lets the PI talk to Craft over Qt `QWebChannel`, including reading or
setting the widget's X/Y position on the secondary screen.

```ts
const qt = useQtWebChannelStore();
qt.x; qt.y;                                   // current position (reactive)
qt.qtObject.uDidReceiveCoordinate(qt.x, qt.y);// push a new position to Craft
qt.handleKeydown;                             // arrow-key nudge handler (add/remove on window)
```

Craft pushes position changes back via `sigDidReceiveCoordinate`. If your plugin
does not need positioning, delete the import and the Coordinates card from the
PI. (It only works inside Craft's webview, where the `qt` global exists.)

### File selector for scene assets

Use this in the PI when selected files should be copied into the scene folder
and included when the user exports the scene:

```ts
qtWebChannel.qtObject.openFileSelectorNew(context, 1, 'jpg,png');
```

The result arrives through `qtWebChannel.qtObject.qmlMessage`. Match the first
callback argument against the same `UUID`/`context`, parse the second argument as
a JSON array, then persist the returned file name/path segment in
`property.settings`. `count` is the maximum selectable file count, and `fileType`
is a comma-separated extension list such as `'jpg,png'`. When replacing a
previous file, call
`qtWebChannel.qtObject.deleteFile(property.settings.path)` before saving the new
path. See `property-inspector.md` for a complete example.

---

## `argv` quick reference

| Access | Meaning |
|--------|---------|
| `window.argv[0]` | WebSocket port |
| `window.argv[1]` | this page's uuid / the PI `context` |
| `window.argv[3].application.language` | app language, e.g. `"zh_CN"` |
| `window.argv[3].plugin.uuid` | full plugin uuid, e.g. `com.mirabox.streamdock.demo` |
| `window.argv[4]` | **PI only** — `{ action, context, payload: { settings, coordinates } }` |
