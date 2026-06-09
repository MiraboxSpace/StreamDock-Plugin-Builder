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

**Prerequisite — Node.js and npm must be installed.** Verify first:

```bash
node -v   # must print a version, e.g. v20.x.x
npm -v    # must print a version
```

If either command is not found, install **Node.js LTS** from https://nodejs.org
and restart the terminal.

```bash
cd <plugin-folder>/plugin
npm install        # installs fs-extra log4js ws + the build tool @vercel/ncc
npm run build      # = npx ncc bundle into a single file + node autofile.js auto-install
```

`npm run build` does three things:
1. `ncc` bundles `index.js` and all dependencies into a single `build/index.js`;
2. `ncc` also bundles `keepalive.js` into `build-keepalive/index.js` (a small
   helper used for the hot-swap below);
3. `autofile.js` copies the whole `.sdPlugin` folder (with `plugin/` replaced by
   the bundle) into the StreamDock plugins directory.

> If `ncc` cannot be installed because of network issues, use
> `npm install --registry=https://registry.npmmirror.com`.

> **Keep-alive handoff:** if the plugin is already running, `autofile.js` does
> not blindly delete and recopy — that made StreamDock crash-loop a relaunch into
> a missing `index.js` and burn its 50-restart budget (then the plugin stays dead
> until the app restarts). Instead it writes the keep-alive bundle over the
> running `plugin/index.js`, kills the process once so StreamDock relaunches the
> keep-alive, and the keep-alive copies the real files in and overwrites itself
> with the production bundle before exiting — handing off to the final version.
> Cost: ~2 of the 50 restarts, no crash-loop. `npm run build` blocks until the
> keep-alive writes its `done` marker. If nothing is running, `autofile.js` does a
> plain in-place copy and asks you to restart the app.

### Development mode — `npm run dev`

For active development, use `npm run dev` instead of `npm run build`:

```bash
npm run dev        # copies a thin launcher + reloads the plugin in StreamDock
```

`devfile.js` does three things:
1. Copies the plugin assets (icons, PI, manifests) to the StreamDock plugins
   folder.
2. Writes a thin **launcher** into `PluginPath/plugin/index.js`. The launcher
   runs your development `index.js` directly using the system Node binary —
   no bundling required.
3. Kills any currently running plugin process. StreamDock detects the exit and
   immediately restarts the plugin, picking up the new launcher (and thus the
   latest source).

**Workflow:** edit → save → `npm run dev` → StreamDock reloads automatically.
No StreamDock app restart needed.

> ⚠ StreamDock allows **~50 consecutive plugin restarts** per session (it
> counts each crash/exit-and-restart). `devfile.js` tracks the count in
> `PluginPath/plugin/.dev-restarts` and warns you at 45 and 50 when you run
> `npm run dev`. If the plugin stops responding, run `npm run dev` to check
> the count, then **restart the StreamDock app** to reset the limit.

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

## 5. Standard workflow and StreamDock restart rules

### Recommended workflow (follow in order)

**Step ①** — first install:

```bash
npm install
npm run dev
```

→ **Restart StreamDock once.** The app does not auto-detect new plugin folders;
a restart loads the plugin for the first time. After this one restart the plugin
is registered and the auto-restart logic is active.

**Step ②** — iterate:

```bash
# edit code, then:
npm run dev
```

StreamDock detects the killed process and immediately relaunches the plugin with
the new source. **No further app restart needed.**

> ⚠ StreamDock allows ~50 consecutive restarts per session. `npm run dev`
> warns you at 45 and 50; restart the StreamDock app to reset the limit.

**Step ③** — release build:

```bash
npm run build
```

`autofile.js` kills the running dev launcher, installs the bundle, and
StreamDock auto-restarts with the bundled plugin. **No manual restart needed**
when coming from a dev session.

### Restart reference

| Situation | StreamDock restart needed? |
|-----------|---------------------------|
| Very first `npm run dev` (plugin folder is new) | **Yes — once** |
| Subsequent `npm run dev` | No — auto-restart |
| `npm run build` after a dev session | No — auto-restart triggered by kill |
| `npm run build` cold (no prior dev session) | **Yes** — no process to trigger restart |
| `manifest.json` changed (UUID, actions, Controllers, States…) | **Depends on version** — StreamDock **after `3.10.202.0512`** hot-reloads manifest (no restart); **`3.10.202.0512` and earlier** read it only at app startup, so **Yes**, restart |
| Property Inspector changes only | No — reopen the key settings panel |

`autofile.js` detects whether a dev process was killed and prints the
appropriate message ("auto-restarting" vs "please restart manually").

> **Plugin not working after build?** If the plugin stops responding, shows a
> blank key, or disappears from the action list after `npm run build`, it is
> usually a `manifest.json` change. The keep-alive handoff only reloads the
> plugin code. Manifest hot-reload was implemented **after StreamDock
> `3.10.202.0512`**: on newer versions the new manifest loads without a restart;
> on `3.10.202.0512` and earlier, `manifest.json` is only read at app startup, so
> the user must **restart the StreamDock app** for action-list/manifest changes.

## 6. Debugging

| Target | Method |
|--------|--------|
| backend `plugin/index.js` | read the log file `plugin/log/<date>.log` (`log.info/error` output). You can also put `--inspect=127.0.0.1:3210` in `manifest.Nodejs.Debug` and attach with Chrome `chrome://inspect` |
| Property Inspector | open `http://localhost:23519/` in a browser — you can see the PI page there and debug it with DevTools |

After changes:
- changed the **backend** code in dev mode → run `npm run dev`; StreamDock
  restarts the plugin automatically (no app restart needed).
- changed the **backend** code in build mode → `npm run build` then restart
  the StreamDock app.
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
| `npm run build` fails with a "file in use" / permission denied / EBUSY error | The keep-alive handoff overwrites the installed `plugin/index.js` while the old process runs; node normally releases that handle, but a watcher/antivirus can hold it. **Quit StreamDock, then re-run `npm run build`** (the not-running path does a plain copy). |
| `npm run build` prints "Timed out waiting for the keep-alive" | The keep-alive did not finish within ~15 s. Check `plugin/log/keepalive.log` in the **installed** plugin folder; if the plugin did not update, quit and reopen StreamDock and build again. |
| PI is blank or shows "undefined" | `$local=true` but a language file is missing keys; a JS error (open `localhost:23519` and check the Console) |
| code changes have no effect | forgot to rebuild the backend; the plugins directory has an old copy |
