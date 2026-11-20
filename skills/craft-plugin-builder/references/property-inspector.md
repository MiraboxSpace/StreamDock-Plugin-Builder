# HTML Property Inspector

Edit propertyInspector/<action>/index.html and index.js.
The shared helper adapts Dock's $settings / $propEvent pattern to Craft.

- Registration: window.connectMiraBoxSDSocket(port,uuid,event,app,actionInfo).
- Expose connectSDSocket, connectSocket and connectElgatoStreamDeckSocket as
  aliases of that function. A visible form alone does not prove registration;
  verify the socket opens and initial settings populate. After changing the
  connection script, close/reopen the PI so Craft calls registration again;
  a browser-only reload may not trigger host registration.
- Parse app and actionInfo JSON. Register using uuid. For PI-originated
  setSettings and sendToPlugin, context must also be this registration uuid
  ($uuid), not actionInfo.context ($context). Craft resolves the PI identity
  to the widget. The two IDs differ in the actual host; confusing them leaves
  the form editable but changes do not reach the backend. Backend-originated
  setSettings/setImage still use the widget context from received events.
- $settings is seeded from actionInfo.payload.settings on socket open, then
  replaced on every didReceiveSettings.
- Assign $settings.text / $settings.bgColor to debounce and persist all custom
  settings. Assigning ActionGeometry is ignored. Nested edits need assigning
  a new top-level object to trigger the proxy.
- $propEvent.didReceiveSettings initializes/re-syncs form values, including
  position-derived values. Do not save from this callback, avoiding loops.
- $propEvent.connected(info) selects UI language; the example translates all
  14 supported locales and falls back to English for unknown languages.
  Root language JSON files localize plugin/action names and tooltips.
- $websocket.sendToPlugin(payload), getGlobalSettings(), setGlobalSettings(payload)
  and openUrl(url) send the matching Craft messages.
- $propEvent.sendToPropertyInspector(payload) and
  $propEvent.didReceiveGlobalSettings(payload) handle backend replies.

## Scene file uploads (Craft-only Qt bridge)

Do not use a browser file input for assets that must travel with a scene.
The Node template already bundles `propertyInspector/utils/qwebchannel.js`
(the existing Qt library adapted to a classic script) and `qt-webchannel.js`
(the shared bridge initializer). The PI loads both before `action.js`.
Keep this script order in every new action's HTML page. No Vue import is needed.
Registration automatically initializes the bridge with `qt.webChannelTransport`.
Await `window.qtWebChannel.init()` before calling a Qt method; it resolves to
`channel.objects.channelqtObject` and also sets `qtWebChannel.qtObject`.
Repeated calls reuse one connection, so do not construct a second QWebChannel
on the same transport. Without Qt (ordinary browser preview), it resolves to
null without breaking WebSocket settings. It can retry if Qt appears later.

```js
async function selectSceneImage() {
    const qtObject = await window.qtWebChannel.init();
    if (!qtObject) return;
    qtObject.openFileSelectorNew($uuid + ':image', 1, 'jpg,png');
}
```

Connect the `qmlMessage` callback once after initialization, before opening
the picker. Keep its selector key consistent with the call above.

Call qtObject.openFileSelectorNew(selectorKey, 1, 'jpg,png').
Subscribe to qtObject.qmlMessage; filter by selectorKey and parse the returned
JSON file list. On cancellation, leave the existing setting untouched.
Store only the returned filename/path segment, not an absolute path.
When replacing a different previous scene asset, delete the old stored file
with qtObject.deleteFile(oldName), then assign $settings.path.
Use separate selector keys for distinct file pickers.

## Coordinates (optional)

Call qtObject.uDidReceiveCoordinate(x,y) to move a widget.
Listen to sigDidReceiveCoordinate for updates. Initialize x/y from
settings.x and settings.y in didReceiveSettings, not before live settings
arrive. Craft persists coordinates. If adding arrow nudges, ignore keys while
an input/textarea/select is focused and remove listeners when closing.

Qt is unavailable in a normal browser and in the Node backend.
PI debugging: http://127.0.0.1:23518 inside a running Craft session.
