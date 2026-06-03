# manifest.json field reference

`manifest.json` sits at the root of the `.sdPlugin` folder and declares the
plugin metadata and all actions.

## Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SDKVersion` | Integer | yes | fixed at `1` |
| `Name` | String | yes | plugin display name |
| `Description` | String | yes | plugin description |
| `Author` | String | yes | author |
| `Version` | String | yes | semantic version, e.g. `"1.0.0"` |
| `Icon` | String | yes | plugin icon path, 128×128 png (extension may be omitted) |
| `Category` | String | no | the group name for actions in the app, default `Custom` |
| `CategoryIcon` | String | no | group icon, 48×48 |
| `CodePathWin` | String | yes* | backend entry on Windows, e.g. `plugin/index.js` |
| `CodePathMac` | String | yes* | backend entry on macOS |
| `CodePath` | String | yes* | unified cross-platform entry (alternative to the two above) |
| `PropertyInspectorPath` | String | no | global default PI path (an action may override it) |
| `URL` | String | no | plugin homepage |
| `OS` | Array | yes | supported platforms, see below |
| `Software` | Object | yes | minimum StreamDock app version |
| `Nodejs` | Object | no | declare it when using the app's built-in Node, see below |
| `ApplicationsToMonitor` | Object | no | apps whose launch/exit to monitor, see below |

\* Either `CodePathWin`+`CodePathMac` or a single `CodePath`; you need at least
one that covers the target platform.

## Actions array

One object per action (one key type):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UUID` | String | yes | unique action ID, reverse-DNS, e.g. `com.acme.streamdock.timer.start`. **The last segment determines the backend property name.** |
| `Name` | String | yes | action name shown in the actions list |
| `Icon` | String | yes | icon in the actions list, 40×40 |
| `Tooltip` | String | no | hover tooltip |
| `States` | Array | yes | appearance-state array, see below; at least 1 |
| `Controllers` | Array | no | supported controller types, default `["Keypad"]`, see below |
| `PropertyInspectorPath` | String | no | HTML path of this action's settings page |
| `Settings` | Object | no | initial settings values (can also be given in the backend `default`) |
| `DisableAutomaticStates` | Boolean | no | when `true`, the key state does not toggle automatically on press; control it in code with `setState` |
| `UserTitleEnabled` | Boolean | no | whether the user may set a custom title, default `true` |
| `SupportedInMultiActions` | Boolean | no | whether it can be used in "multi-actions / workflows", default `true` |
| `VisibleInActionsList` | Boolean | no | whether it appears in the actions list, default `true` |
| `OS` | Array | no | platforms this action alone is limited to |

### Controllers values

| Value | Meaning |
|-------|---------|
| `"Keypad"` | standard key (default) |
| `"Knob"` or `"Encoder"` | dial (rotate/press; some devices have a small screen) |
| `"Information"` | read-only display, does not respond to presses |
| `"SecondaryScreen"` | secondary screen |

Dial actions use the `dialDown / dialUp / dialRotate / touchTap` events (see
`events.md`).

## States array

Each state describes one appearance. A normal action has 1 state; an on/off
action has 2 states (switched with `setState`).

| Field | Type | Description |
|-------|------|-------------|
| `Image` | String | background image path for this state, 72×72 png/svg |
| `Title` | String | default title text |
| `ShowTitle` | Boolean | whether to show the title, default `true` |
| `TitleColor` | String | title color, e.g. `"#ffffff"` |
| `TitleAlignment` | String | `"top"` / `"bottom"` / `"center"` |
| `FontFamily` | String | font |
| `FontStyle` | String | `"Regular"` / `"Bold"` / `"Italic"` / `"Bold Italic"` |
| `FontSize` | String | font size, e.g. `"12"` |
| `FontUnderline` | Boolean | whether to underline, default `false` |

> If an action draws the whole image itself with `setImage` (dynamic
> numbers/graphics), the font-related `States` fields
> (`FontSize/TitleColor/TitleAlignment`) have basically no effect — leave them
> at defaults. Also set the action's `UserTitleEnabled` to `false` so a
> user-set title does not overlay the drawn content.

## OS array

```json
"OS": [
  { "Platform": "windows", "MinimumVersion": "10" },
  { "Platform": "mac", "MinimumVersion": "10.15" }
]
```

`Platform` is `"windows"` or `"mac"`.

## Software object

```json
"Software": { "MinimumVersion": "3.10.188.226" }
```

To use the built-in Node, Windows needs `3.10.188.226+` and macOS needs
`3.10.191.0421+`.

## Nodejs object

```json
"Nodejs": { "Version": "20", "Debug": "--inspect=127.0.0.1:3210" }
```

| Field | Description |
|-------|-------------|
| `Version` | currently only `"20"` is supported (the app's built-in Node 20.8.1) |
| `Debug` | optional debug arguments, e.g. `--inspect=127.0.0.1:3210` |

When `Nodejs` is declared, the plugin runs through the app's built-in Node and
need not bundle a Node runtime. **But npm dependencies such as `ws`/`log4js`
still need to be bundled in with `npm run build`.**

## ApplicationsToMonitor object

```json
"ApplicationsToMonitor": {
  "windows": ["chrome.exe"],
  "mac": ["com.google.Chrome"]
}
```

Once declared, launching/exiting these apps fires the `applicationDidLaunch` /
`applicationDidTerminate` events.

## Full example

See the template `assets/plugin-template/manifest.json` (a single Keypad
action).
