---
name: craft-plugin-builder
description: >-
  Build or modify MiraBox Craft secondary-screen plugins using a Node.js
  backend, manifest.json, and an HTML Property Inspector. Use for Craft
  widgets, dashboards, clocks, images, or status displays, not StreamDock keys.
metadata: {"hermes": {"category": "development", "tags": ["craft", "mirabox", "plugin", "secondary-screen", "nodejs"]}}
---

# MiraBox Craft Plugin Development

Use `assets/plugin-template/`: a Node.js backend adapted from the Dock
template, with a separate HTML/JavaScript Property Inspector (PI).
The Vue template is available in `assets/vue-template/`, with its documentation
in `references/vue/`. Use it when the user requests a Vue plugin.
Do not use the old template ZIP for new projects.

## Required Craft differences

- Windows Craft **5.1.018.1021 or newer** supports the built-in Node launcher.
  Set `CodePath: "plugin/index.js"` and `Nodejs: { Version: "20" }`.
  Do not substitute Dock's `CodePathWin/CodePathMac`. macOS built-in Node
  support is not confirmed by the referenced docs; verify before enabling it.
- Installed folder: `com.mirabox.streamdock.<name>.mPanelPlugin`, not
  `.sdPlugin`. The installer derives the name from the first action UUID.
  Keep all action UUIDs under the same plugin prefix.
- Both Node and Vue installers resolve the Windows plugin directory in this
  order: `CRAFT_PLUGINS_DIR` override; `[DeviceTypeDownNum]` →
  `MiraBox%20Craft` in `%APPDATA%/HotSpot/configuration.ini` (data directory,
  append `plugins`); otherwise `%APPDATA%/HotSpot/MiraBox Craft/plugins`.
  Preserve the bundled `craft-paths.cjs` helper when copying either template.
  Do not hardcode a drive or assume the default data directory is active.
- Every action uses `Controllers: ["SecondaryScreen"]` and default
  `Settings.ActionGeometry: { width, height }`.
- Craft is display-only: no key/dial/touch events, title/state API, OK/alert
  feedback, device/app/system events, or PI-appearance events.
- Use Dock-style `Plugins` / `Actions`. Lifecycle handlers have underscore
  prefixes: `_willAppear`, `_didReceiveSettings`, `_willDisappear`.
  `sendToPlugin` is bare; `plugin.didReceiveGlobalSettings` is plugin-level.
- Draw using current `this.data[context].ActionGeometry`. The default sample
  sends an encoded SVG; Node has no DOM canvas. For raster rendering use a
  Node-compatible drawing library, verify native binary packaging separately.
- `setSettings` cannot resize: send an image with the new dimensions.
  Geometry from on-screen resizing arrives through `didReceiveSettings`.
- Use Node `setInterval/clearInterval`, one timer per context; clean up on
  disappearance. Vue Worker timers are not needed in Node.
- PI registration implements `window.connectMiraBoxSDSocket` and exposes
  `connectSDSocket`, `connectSocket`, and `connectElgatoStreamDeckSocket`
  aliases. Craft versions can call these compatibility entries; without them
  the form may load but never connect. PI setSettings/sendToPlugin use the PI
  registration UUID as context; backend writes use the widget context from
  received events. The two IDs differ in Craft and are not interchangeable.
- Global settings, binary image push, and `lightControl` are supported.
  Global settings events and screen-wide light effects carry no context.
  Alarm owners must clean up and coordinate across instances.

## Workflow

1. Map the request to display content, data source, configurable settings,
   actions, refresh rate, and language; use sensible defaults where possible.
2. Copy `assets/plugin-template/` into a new project, excluding generated
   `plugin/node_modules/`, `plugin/build/`, and `plugin/log/` if present.
   Edit `manifest.json`
   directly; synchronize action UUID suffixes, `plugin.<suffix>`, PI paths,
   and language-file UUID keys. See `references/manifest.md`.
3. Implement backend handlers in `plugin/index.js`. Redraw on appearance
   and settings changes; stop timers/requests in disappearance.
4. Edit `propertyInspector/<suffix>/index.html` and `index.js`.
   Assign `$settings.field` to persist. Initialize from registration settings
   and re-sync on every `didReceiveSettings`; never write geometry to resize.
   QWebChannel is bundled and initialized in the PI. Await
   `window.qtWebChannel.init()` to access Craft's Qt object for scene file
   selection or coordinates; see the PI reference. This bridge runs in the
   browser PI, not in the Node backend.
5. Verify `node -v` and `npm -v`, then `cd plugin && npm install`.
   If a network failure occurs, an npm mirror may be used explicitly.
6. Default to `npm run dev`, not a production build. Close Craft before
   replacing an existing installation; restart Craft afterward. This template
   deliberately does not copy Dock's process-killing/keepalive/restart-budget
   assumptions. See `references/build-and-debug.md`.
7. Tell the user what changed and which action to test (including PI editing
   and on-screen resize), and ask them to confirm it works in Craft.
   Only after confirmation/request for release run `npm run build`.
   `npm run bundle` is available for non-installing build validation.

## References

| File | Read when |
| --- | --- |
| `references/architecture.md` | Understanding Node registration and routing |
| `references/manifest.md` | Naming, entry points, geometry, platform support |
| `references/events.md` | Checking supported events and payloads |
| `references/sdk-api.md` | Calling backend helpers and binary images |
| `references/property-inspector.md` | Editing settings, Qt files, coordinates |
| `references/build-and-debug.md` | Installing, bundling, debugging |
| `references/requirement-mapping.md` | Choosing an implementation |
| `references/recipes.md` | Timers, HTTP, rendering, alarms |
| `references/checklist.md` | Validating delivery |

Protocol checked against Craft Wiki `wiki-0mpkl15e` on 2026-11-10:
`zh/guide/manifest.md`, `registration.md`, `events-sent.md`,
`events-received.md`, and `property-inspector.md`. Source links are in the
manifest/event references. Do not carry over incompatible Dock APIs.
