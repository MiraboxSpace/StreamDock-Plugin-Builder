# manifest reference (`src/manifest.cjs` → `dist/manifest.json`)

You do **not** write `manifest.json` by hand. You edit **`src/manifest.cjs`**,
and `script/autofile.cjs` generates `dist/manifest.json` plus every
`dist/<lang>.json` from it at dev/build time. Editing `dist/manifest.json`
directly is pointless — it is overwritten on the next build.

## `manifest.cjs` shape

```js
const Plugin = {
  UUID: 'demo',            // plugin short name → com.mirabox.streamdock.demo
  version: '1.0.0',        // build stamps this as 1.0.<YYMMDD>
  APIVersion: '1.0',
  Icon: 'images/icon.svg', // plugin + category icon
  i18n: { en: { Name, Description }, zh_CN: {...}, /* 11 languages */ }
};

const Actions = [
  {
    UUID: 'action1',                 // action short name (= file names)
    Icon: 'images/icon.svg',
    i18n: { en: { Name, Tooltip }, zh_CN: {...}, ... },
    state: 0,
    States: [{ FontSize: '10', TitleAlignment: 'bottom' }],
    Settings: {
      ActionGeometry: { width: 680, height: 460 },  // ★ REQUIRED default canvas size
      // ...your own default settings keys...
    },
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['SecondaryScreen']
  }
];

module.exports = { PUUID: Plugin.UUID, Version: Plugin.version, APIVersion: Plugin.APIVersion,
                   CategoryIcon: Plugin.Icon, i18n: Plugin.i18n, Actions };
```

## Plugin fields you set

| Field | Description |
|-------|-------------|
| `UUID` | plugin short name. Becomes `com.mirabox.streamdock.<UUID>`; the install folder is `com.mirabox.streamdock.<UUID>.mPanelPlugin`. **Lowercase, no spaces.** |
| `version` | semver `major.minor.patch`; the build replaces patch with a `YYMMDD` date stamp |
| `APIVersion` | keep `'1.0'` |
| `Icon` | path under `public/` to the plugin/category icon |
| `i18n[lang].Name` / `.Description` | localized plugin name and description |

## Action fields you set

| Field | Required | Description |
|-------|----------|-------------|
| `UUID` | yes | action short name. Final uuid = `com.mirabox.streamdock.<plugin>.<UUID>`. **Must equal `src/plugin/actions/<UUID>.ts` and `src/pages/actions/<UUID>.vue`.** |
| `Icon` | yes | icon shown in Craft's action list |
| `i18n[lang].Name` / `.Tooltip` | yes | localized action name + tooltip |
| `Settings.ActionGeometry` | **yes** | `{ width, height }` — the default canvas size Craft asks you to draw at. **Every action must have this.** |
| `Settings.*` | no | any other default settings keys your draw logic / PI use |
| `Controllers` | yes | `['SecondaryScreen']` for Craft |
| `States` | yes | keep one entry; Craft does not switch states, so this is mostly vestigial |
| `state` | no | default state index, `0` |
| `UserTitleEnabled` | no | keep `false` — Craft has no titles |
| `SupportedInMultiActions` | no | keep `false` |

### `ActionGeometry` — the one special setting

- It is the **canvas size in pixels** for the widget: `{ width, height }`.
- It is the **only** settings field `setSettings` cannot change.
- The default in `manifest.cjs` is the size a freshly-dragged widget starts at
  (the bundled template uses `{ width: 680, height: 460 }`).
- At runtime, read it every draw: `settings.ActionGeometry.width/height`.
- To change the size from code, **draw a different-sized canvas and `setImage`
  it** — Craft updates `ActionGeometry` to match the image, then sends you a
  `didReceiveSettings`.
- When the user resizes the widget on screen, you get `didReceiveSettings` with
  the new `ActionGeometry`.

### `Controllers`

For Craft, always `['SecondaryScreen']`. (StreamDock's `Keypad` / `Knob` /
`Encoder` / `Information` values do not apply — Craft is display-only.)

## What `autofile.cjs` generates (you do not set these)

The script fills in the rest of `manifest.json` automatically:

| Generated field | Value |
|-----------------|-------|
| `Version` | `<major>.<minor>.<YYMMDD>` |
| `Name` / `Category` / `Description` / `Icon` / `CategoryIcon` | from `Plugin.i18n.en` + `Plugin.Icon` |
| `SDKVersion` | `1` |
| `Author` | `MiraBox` |
| `URL` | MiraBox homepage |
| `OS` | `mac` (10.11+) and `windows` (7+) |
| `CodePath` / `PropertyInspectorPath` | `_.html` in dev, `index.html` in build |
| each action's `UUID` | prefixed to `com.mirabox.streamdock.<plugin>.<UUID>` |
| `dist/<lang>.json` | per-language `Name` / `Category` / `Description` and per-action `Name` / `Tooltip` |

## Adding a second action

1. Add an entry to `Actions` in `manifest.cjs` (new `UUID`, e.g. `action2`).
2. Create `src/plugin/actions/action2.ts` (draw logic).
3. Create `src/pages/actions/action2.vue` (its PI).

The runtime auto-registers every file under `src/plugin/actions/`, and the PI
host loads `src/pages/actions/<last-uuid-segment>.vue` for whichever action the
user is editing — so matching file names is all that is required.
