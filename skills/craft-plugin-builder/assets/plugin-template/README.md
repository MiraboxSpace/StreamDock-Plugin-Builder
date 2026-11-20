# Craft Node.js template

Adapted from the sibling StreamDock Node template: `Plugins` / `Actions`, plain HTML PI, ncc bundle, and development launcher. No Vue or Vite runtime is needed.

The PI includes `utils/qwebchannel.js` and `utils/qt-webchannel.js`. Load them before `utils/action.js`. In PI code, `await window.qtWebChannel.init()` returns Craft's `channelqtObject` for scene file selection and coordinate APIs, or null outside Craft. Initialization is shared per page; the Node backend does not use this browser bridge.

Requires Windows Craft 5.1.018.1021 or newer. `Nodejs.Version` is `20` as documented by Craft. macOS built-in Node support is not confirmed; verify separately before declaring macOS support.

Edit `manifest.json`, `plugin/index.js`, and `propertyInspector/action1/`. Match the action UUID suffix to `plugin.action1`. The installer derives `com.mirabox.streamdock.demo.mPanelPlugin` from the action UUID.

```powershell
cd plugin
npm install
npm run dev
```

Restart Craft, drag Text Card to the secondary screen, edit text/colors and resize. Backend edits need another `npm run dev` and Craft restart. Once the user confirms it works, run `npm run build`. `npm run bundle` only compiles locally without installing. Close Craft before overwriting an existing installation.

Dev mode is a development version, not a portable release. Test it and confirm
it works before requesting production. `npm run build` then compiles, installs
to the active Craft directory, and automatically creates
`release/<plugin-id>.mPanelPlugin` via postbuild. This is a ZIP with the manifest
at its root, no wrapper folder and no `.zip` suffix. Share this installer with
other users or upload it to https://space.mirabox.net/contentUpload. `npm run
package` only recreates an installer from existing production output; it does
not compile or install.

Windows dev/build installation reads `%APPDATA%/HotSpot/configuration.ini`, section `[DeviceTypeDownNum]`, key `MiraBox%20Craft`, and appends `plugins` to the configured data directory. Without a configured directory it uses `%APPDATA%/HotSpot/MiraBox Craft/plugins`. `CRAFT_PLUGINS_DIR` overrides both and must point directly to the plugins directory. Keep `plugin/craft-paths.cjs` with the template. Invalid configured paths stop installation rather than falling back silently. Build copies every ncc output asset, not only index.js. Native drawing dependencies need validation on the target OS/architecture.
