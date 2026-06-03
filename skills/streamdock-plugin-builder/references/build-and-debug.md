# Naming, building, installing, debugging

## 1. Naming rules

| Thing | Rule | Example |
|-------|------|---------|
| plugin folder | `com.<vendor>.streamdock.<name>.sdPlugin`, all lowercase | `com.acme.streamdock.timer.sdPlugin` |
| plugin ID prefix | the folder name without `.sdPlugin` | `com.acme.streamdock.timer` |
| action UUID | one more segment after the plugin ID | `com.acme.streamdock.timer.start` |

## 2. Rename checklist from the template (coupled spots — missing one breaks things)

After copying `assets/plugin-template/`, assume the new plugin ID is
`com.acme.streamdock.timer` and the action UUID is
`com.acme.streamdock.timer.start`:

- [ ] rename the folder to `com.acme.streamdock.timer.sdPlugin`
- [ ] `manifest.json`: `Name / Description / Category / Author / URL`
- [ ] `manifest.json`: the action's `UUID` → `com.acme.streamdock.timer.start`
- [ ] `manifest.json`: the action's `Name / Tooltip`
- [ ] `manifest.json`: the action's `PropertyInspectorPath` → `propertyInspector/start/index.html`
- [ ] `plugin/index.js`: `plugin.count` → `plugin.start` (= the last UUID segment)
- [ ] `plugin/package.json`: `name / author / description` (works without changing, just for tidiness)
- [ ] the PI folder `propertyInspector/count/` → `propertyInspector/start/`
- [ ] every `<lang>.json`: the key `com.example.streamdock.counter.count` → the new UUID
- [ ] every `<lang>.json`: `Name / Description / Category`
- [ ] replace the icon `static/App-logo.svg` (128×128; you can keep the placeholder to get it running first)

> With multiple actions, each action needs its own UUID, `plugin.<x>`, PI
> folder, and language keys.

## 3. Installing dependencies and building

The app's built-in Node has no `ws / log4js`, so **bundling before shipping is
mandatory**.

```bash
cd <plugin-folder>/plugin
npm install        # installs fs-extra log4js ws + the build tool @vercel/ncc
npm run build      # = npx ncc bundle into a single file + node autofile.js auto-install
```

`npm run build` does two things:
1. `ncc` bundles `index.js` and all dependencies into a single `build/index.js`;
2. `autofile.js` copies the whole `.sdPlugin` folder (with `plugin/` replaced by
   the bundle) into the StreamDock plugins directory.

> If `ncc` cannot be installed because of network issues, use
> `npm install --registry=https://registry.npmmirror.com`.

## 4. Plugin install directory

| OS | Path |
|----|------|
| Windows | `%APPDATA%\HotSpot\StreamDock\plugins\` |
| macOS | `~/Library/Application Support/HotSpot/StreamDock/plugins/` |

`autofile.js` picks this automatically by OS. You can also copy the whole
`.sdPlugin` folder in by hand.

**No-build development mode**: after `npm install` in `plugin/`, copy the whole
`.sdPlugin` folder (including `plugin/node_modules`) into the directory above —
this runs without bundling, but it is large and only suitable for local
debugging.

## 5. Getting the app to recognize the plugin

**After every build / plugin update, restart the StreamDock app** — only then
does it load or refresh plugins. (When you change only the Property Inspector,
no restart is needed — just reopen the settings panel; see section 6.)

`autofile.js` also prints a "please restart StreamDock" notice when
`npm run build` finishes. After restart, the plugin appears under its
`Category` group in the actions list; drag it onto a key to use it.

> Always state the "restart StreamDock" step explicitly when handing off, or
> the user will think the plugin failed to install.

## 6. Debugging

| Target | Method |
|--------|--------|
| backend `plugin/index.js` | read the log file `plugin/log/<date>.log` (`log.info/error` output). You can also put `--inspect=127.0.0.1:3210` in `manifest.Nodejs.Debug` and attach with Chrome `chrome://inspect` |
| Property Inspector | open `http://localhost:23519/` in a browser — you can see the PI page there and debug it with DevTools |

After changes:
- changed the **backend** code → rebuild with `npm run build` and restart the
  app (or reload the plugin).
- changed the **PI** code → just reopen the key's settings panel, no restart
  needed.

## 7. Common error troubleshooting

| Symptom | Cause / check |
|---------|---------------|
| plugin does not appear in the actions list | folder name not in `com.*.sdPlugin` form; `manifest.json` syntax error; app not restarted |
| the action drags on but does nothing | `plugin.<x>` name ≠ last UUID segment; the backend process crashed — check `log/` |
| backend exits immediately on start | no `npm run build`, the built-in Node cannot find `ws/log4js`; check `log/` for an Uncaught Exception |
| blank key | `setImage` path/format wrong; the SVG uses `#` colors or features unsupported by SVG Tiny 1.2 (see `recipes.md`); `States[].Image` points to a missing file |
| plugin not appearing / not updating after a build | the StreamDock app was not restarted |
| `npm run build` fails with a "file in use" / permission denied / EBUSY error | StreamDock is running and the previously installed plugin is still active — `autofile.js` tries to delete the old copy first but cannot. **Quit StreamDock, then re-run `npm run build`.** |
| PI is blank or shows "undefined" | `$local=true` but a language file is missing keys; a JS error (open `localhost:23519` and check the Console) |
| code changes have no effect | forgot to rebuild the backend; the plugins directory has an old copy |
