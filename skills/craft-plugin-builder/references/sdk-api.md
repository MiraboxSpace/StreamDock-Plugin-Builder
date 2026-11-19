# Node SDK

`const { Plugins, Actions, log } = require('./utils/plugin')`.
Create one `new Plugins()` and attach `plugin.<actionSuffix> = new Actions({...})`.

Actions.default holds default settings. Each instance receives its own cloned
defaults merged with payload.settings, accessible through this.data[context].
Implement _willAppear, _didReceiveSettings, _willDisappear, not their unprefixed
interceptors. sendToPlugin is unprefixed.

| Method | Meaning |
| --- | --- |
| plugin.setImage(context, image) | encoded SVG or raster dataURL |
| plugin.setImageBlob(context, bytes, type='image/webp') | Buffer/Uint8Array encoded image |
| plugin.setSettings(context, settings) | saves fields except ActionGeometry |
| plugin.sendToPropertyInspector(context, payload, action?) | explicit instance routing; action defaults to cached UUID |
| plugin.getGlobalSettings() | request plugin-wide settings |
| plugin.setGlobalSettings(payload) | save plugin-wide settings |
| plugin.openUrl(url) | browser URL |
| plugin.lightControl(payload) | global screen effect |
| plugin.send(message) | raw JSON, false when socket not open |

Plugins.language comes from info.application.language, falling back to en.
Plugins.globalSettings updates before didReceiveGlobalSettings is called.
plugin.info contains the parsed host information, including fonts.

For PNG bytes: `plugin.setImageBlob(context, pngBuffer, 'image/png')`.
setImageBlob frames a UTF-8 JSON header with a big-endian length. It does not
encode or convert images. Use ws.bufferedAmount to limit high-frequency
producers and discard obsolete frames rather than queueing indefinitely.

No implicit current-PI state: Craft does not send propertyInspectorDidAppear.
Explicit context is required for asynchronous replies and multiple widgets.

Use Node timers and cancel them on disappearance. For async render/fetch,
guard against late results after disappearance or newer settings.
Log files are written beside the Node entry in its log directory (bundled output:
plugin/log/craft.log). Use log.info/log.error, not a browser console.
