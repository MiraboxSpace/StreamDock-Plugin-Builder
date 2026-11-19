# Manifest

Edit the template's root `manifest.json` directly. No generated manifest.cjs.

- `CodePath: "plugin/index.js"`; Craft recognizes .js/.cjs/.mjs Node entries.
- `Nodejs: { "Version": "20" }`, `SDKVersion: 1`.
- Windows requires Craft >= **5.1.018.1021**. The Wiki states that release
  includes Node 24.22.0 but explicitly instructs setting Version to "20".
  Do not infer native-addon ABI from this field; verify on the actual host.
- The template declares Windows only; confirm macOS Node support before adding
  it to OS. Do not copy Dock's minimum application version.
- Action `UUID`: full ID, e.g. `com.mirabox.streamdock.demo.action1`.
  Set every action to the same plugin prefix.
- `Controllers: ["SecondaryScreen"]`.
- `Settings.ActionGeometry: { "width": 680, "height": 460 }` is required.
- `PropertyInspectorPath: "propertyInspector/action1/index.html"`; optional
  for an action that does not require settings.
- Name, Icon, Version, Actions are required. Category, CategoryIcon,
  Description, Author, Tooltip and URL describe the plugin.
- No Dock states, user titles, button controllers or multi-actions.

Rename UUID suffix, backend property, PI directory/path and all localization
UUID keys together. The installer derives the installed folder as
`<plugin-prefix>.mPanelPlugin`; it must not use the source folder basename.

Geometry is read on every render. setSettings cannot resize. A newly sized
image updates geometry in Craft; user resizing sends didReceiveSettings.

[Wiki manifest](https://ai.key123.vip:20001/wiki/wiki-0mpkl15e/page/page-9b36c084-2055-4849-adbc-6070fd45eea3)
