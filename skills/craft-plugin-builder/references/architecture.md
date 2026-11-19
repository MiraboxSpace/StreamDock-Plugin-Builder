# Architecture

```text
manifest.json                 Craft source manifest
plugin/index.js               Node backend, Plugins + Actions
plugin/utils/plugin.js        WebSocket protocol and lifecycle store
plugin/package.json           dependencies and dev/bundle/build commands
plugin/install.js             shared install helper
plugin/devfile.js              dev launcher installation
plugin/autofile.js             production bundle installation
propertyInspector/action1/    standalone HTML + JavaScript settings
propertyInspector/utils/      Craft PI connection/settings helper
static/                       plugin icon
<language>.json               plugin and action localization
```

Craft starts the backend with named flags `-port`, `-pluginUUID`,
`-registerEvent`, `-info`. Do not assume fixed process.argv positions.
The SDK connects to localhost and sends `{event, uuid}` on open, then requests
global settings. The registration UUID is not a widget context or action UUID.

Action dispatch follows Dock's UUID-last-segment convention:
`com.mirabox.streamdock.demo.action1` routes to `plugin.action1`.
The SDK caches context-to-action mappings for messages without an action field.
Lifecycle interceptors update per-context settings before user handlers run.
Disappearance runs cleanup before deleting state.

The PI remains a browser page. It exposes `window.connectMiraBoxSDSocket`
with five parameters and registers independently. PI-originated setSettings
and sendToPlugin use the PI registration UUID as context; Craft resolves it
to the widget. The Node backend uses the widget context from received events.
These IDs are not interchangeable. The PI does not share Node memory.

The default renderer is encoded SVG, requiring no native drawing dependency.
Node does not have document, window, HTML canvas, Vue, or Worker timers.
