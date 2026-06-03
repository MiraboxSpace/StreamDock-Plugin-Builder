# Property Inspector (PI) development

The PI is the settings panel that pops up when the user clicks "edit a key." It
is a standalone HTML page at `propertyInspector/<action>/index.html`, pointed to
by the action's `PropertyInspectorPath` in the `manifest`.

**If an action has nothing to configure, do not give it a PI**: just remove the
action's `PropertyInspectorPath` and its `propertyInspector/<action>/` folder.

## Structure

One subfolder per action:

```
propertyInspector/
├── <action>/
│   ├── index.html      # form structure
│   └── index.js        # logic: echo back + persist
└── utils/              # shared by every action's PI — do not change
    ├── common.js  action.js  axios.js
    ├── bootstrap.min.css  bootstrap-icons.css
    └── fonts/
```

## Writing index.html

- Content must be inside `<div class="sdpi-wrapper">`.
- At the end, include scripts in the fixed order:
  `common.js → action.js → axios.js → index.js`.
- Style with the bundled Bootstrap 5 (`form-control`, `form-select`, `btn`,
  `mb-3`, etc.).
- Dark background; copy the body styles from the template.

```html
<div class="sdpi-wrapper p-3">
  <div class="mb-3">
    <label class="form-label">Volume</label>
    <input type="num" id="volume" class="form-control" value="50">
  </div>
  <div class="mb-3">
    <label class="form-label">Mode</label>
    <select class="form-select" id="mode">
      <option value="a">A</option>
      <option value="b">B</option>
    </select>
  </div>
</div>
```

Common controls: `input` (text/num/checkbox/file), `select`, `textarea`,
`button`. `type="num"` is automatically restricted to digits.

## Writing index.js

Four things: define `$local/$back/$dom`, define `$propEvent` to echo settings
back, bind controls to write into `$settings`, and (optionally) exchange
messages with the backend.

```js
/// <reference path="../utils/common.js" />
/// <reference path="../utils/action.js" />

const $local = false, $back = false, $dom = {
    main:   $('.sdpi-wrapper'),
    volume: $('#volume'),
    mode:   $('#mode')
};

// app → PI: echo the persisted settings back into the form
const $propEvent = {
    didReceiveSettings({ settings }) {
        $dom.volume.value = settings.volume ?? 50;
        $dom.mode.value   = settings.mode ?? 'a';
    },
    didReceiveGlobalSettings({ settings }) {},
    sendToPropertyInspector(payload) {}
};

// form → settings: assigning to $settings auto-persists
$dom.volume.on('change', () => { $settings.volume = Number($dom.volume.value); });
$dom.mode.on('change',   () => { $settings.mode = $dom.mode.value; });

// notify the backend when needed
// $websocket.sendToPlugin({ action: 'refresh' });
```

### `$local` and `$back`

| Variable | Purpose |
|----------|---------|
| `$local` | when `true`, enables "automatic PI text translation" (see below); set `false` for a single-language plugin |
| `$back`  | when `false`, the UI is shown automatically after `didReceiveSettings`; when `true`, you control `$dom.main.style.display` yourself |

### `$settings` auto-persistence

`$settings` is a Proxy — **any property assignment auto-runs `setSettings`
after a debounce.** Do not hand-assemble a `setSettings` message. `$settings`
only exists after the first `didReceiveSettings`, so code that reads/writes it
should live in user-interaction callbacks (it is guaranteed ready by then).

## PI text localization (`$local`)

With `$local = true`, `action.js` walks every **text node** inside
`sdpi-wrapper` and the `placeholder` of every `input/textarea`, replacing each
via the `Localization` table of `<current-language>.json`.

**Pitfall:** if a piece of text has no matching key in a language file's
`Localization`, it is replaced with the literal string `"undefined"`.

Two safe approaches, pick one:

1. **Single-language plugin**: `$local = false`, write the target-language text
   directly in the HTML (the template default).
2. **Multi-language plugin**: `$local = true`, and make sure **every** piece of
   text in the HTML has a key in **every** `<lang>.json`'s `Localization`
   (English fallback values are fine to start with).

## File picker

```html
<input type="file" id="bgimg">
```

```js
$emit.on('File-bgimg', (data) => {
    // the user finished picking a file; data is the file info returned by the app
});
```

The `$emit` event name is `File-` plus the `<input>`'s `id`.

## Debugging the PI

The PI runs in an embedded browser; open DevTools at `localhost:23519` (the
default). After editing PI files, just reopen the settings panel to apply the
change — no need to restart the app. See `build-and-debug.md`.
