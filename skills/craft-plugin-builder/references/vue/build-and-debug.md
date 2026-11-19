# Naming, building, installing, debugging

## 1. Naming rules

| Thing | Rule | Example |
|-------|------|---------|
| `Plugin.UUID` (in `manifest.cjs`) | plugin short name, lowercase, no spaces | `weather` |
| plugin id | `com.mirabox.streamdock.<UUID>` (prefix added by `autofile.cjs`) | `com.mirabox.streamdock.weather` |
| install folder | `com.mirabox.streamdock.<UUID>.mPanelPlugin` | `com.mirabox.streamdock.weather.mPanelPlugin` |
| action `UUID` (in `manifest.cjs`) | action short name | `current` |
| action id | `com.mirabox.streamdock.<plugin>.<action>` | `com.mirabox.streamdock.weather.current` |

The `com.mirabox.streamdock.` prefix and the `.mPanelPlugin` suffix are
hard-coded in `script/autofile.cjs` — you do not type them.

## 2. Rename checklist (from the template)

After copying `assets/plugin-template/`, to make a plugin `weather` with one
action `current`:

- [ ] `src/manifest.cjs`: `Plugin.UUID` → `weather`
- [ ] `src/manifest.cjs`: `Plugin.i18n[*].Name` / `.Description`
- [ ] `src/manifest.cjs`: the action's `UUID` → `current`, and its `i18n` `Name`/`Tooltip`
- [ ] `src/manifest.cjs`: keep `Settings.ActionGeometry`, set your own default settings keys
- [ ] rename `src/plugin/actions/action1.ts` → `current.ts`
- [ ] rename `src/pages/actions/action1.vue` → `current.vue`
- [ ] `src/hooks/i18n.ts`: PI label strings for your fields
- [ ] replace `public/images/icon.svg` (you can keep the placeholder to get it running first)

> The action file names and the action `UUID` must match — that is the single
> most common mistake. Nothing else couples to the names (the runtime globs the
> actions folder, the PI host resolves by uuid segment).
>
> Multiple actions: each needs its own `Actions` entry, `actions/<uuid>.ts`, and
> `pages/actions/<uuid>.vue`.

## 3. Install dependencies

**Prerequisite — Node.js and npm:**

```bash
node -v   # e.g. v20.x.x
npm -v
```

If missing, install **Node.js LTS** from https://nodejs.org and restart the
terminal. Then, from the plugin root (where `package.json` is):

```bash
npm install          # or: pnpm i   (the lockfile is pnpm, but npm works fine)
```

On network failure use the mirror: `npm install --registry=https://registry.npmmirror.com`.

## 4. Develop — `npm run dev`

```bash
npm run dev
```

This runs `node ./script/autofile.cjs dev && vite`:

1. `autofile.cjs dev` generates a **dev** `manifest.json` whose `CodePath` and
   `PropertyInspectorPath` point to `_.html`, copies `public/` + the manifests
   into Craft's plugins folder.
2. `_.html` redirects the Craft webview to the Vite dev server
   (`http://localhost:5173`), so the live Vue app runs inside Craft.
3. `vite` starts that dev server with hot-reload.

**After the very first `npm run dev`, restart the Craft app once** so it loads
the new plugin folder. After that, drag the action onto the secondary screen;
code edits hot-reload in place — no further restart, no app rebuild.

> Keep `npm run dev` running while you iterate (it is the Vite server). Stopping
> it stops hot-reload and the widget can no longer reach `localhost:5173`.

## 5. Build — `npm run build`

Only once the user confirms the plugin works (see SKILL.md RULE 1/RULE 2):

```bash
npm run build
```

This runs `vite build && node ./script/autofile.cjs`:

1. `vite build` + `vite-plugin-singlefile` bundles the whole app into a single
   `dist/index.html` (all JS/CSS inlined).
2. `autofile.cjs` generates the production `manifest.json` (`CodePath` /
   `PropertyInspectorPath` = `index.html`) and every `dist/<lang>.json`, then
   copies `dist/` into Craft's plugins folder.

Tell the user to **reload the widget (or restart Craft)** to pick up the
production bundle (the webview is now loading the bundled file instead of the
dev server).

## 6. Install directory

`autofile.cjs` uses the bundled `script/craft-paths.cjs` for both dev and build.
On Windows, `CRAFT_PLUGINS_DIR` overrides the destination plugin root.
Otherwise it reads `%APPDATA%\HotSpot\configuration.ini`, section
`[DeviceTypeDownNum]`, key `MiraBox%20Craft`, and appends `plugins` to that
data directory. If no directory is configured, the default is:

```
%APPDATA%\HotSpot\MiraBox Craft\plugins\com.mirabox.streamdock.<UUID>.mPanelPlugin
```

For example, `MiraBox%20Craft=F:/CraftData/MiraBox Craft` selects
`F:/CraftData/MiraBox Craft/plugins`. The explicit override already names
the plugins directory. Invalid configured paths fail instead of silently
installing elsewhere. On macOS set `CRAFT_PLUGINS_DIR` to the verified Craft
plugins directory. See `../build-and-debug.md` for configuration details.

If you cannot build on the target machine, deliver the built `dist/` folder (or
the whole project) and include these install steps.

## 7. Restart reference

| Situation | Restart Craft? |
|-----------|----------------|
| Very first `npm run dev` (new plugin folder) | **Yes — once** |
| Subsequent edits in dev | No — Vite hot-reloads |
| Changed `manifest.cjs` (added/renamed an action, changed icon) | **Yes** — re-run `npm run dev`/`build`, then restart Craft so it re-reads the manifest |
| `npm run build` | Reload the widget (or restart Craft) to swap dev server → bundle |
| PI-only changes in dev | No — reopen the widget's settings panel |

## 8. Debugging

| Target | Method |
|--------|--------|
| Runtime drawing / PI logic (dev) | Open `http://localhost:5173` in a desktop browser and use DevTools. The same Vue app runs there. (Note: `qtWebChannel` position features only work inside Craft, where the `qt` global exists.) |
| What Craft is sending | `console.log` in your action handler / `usePluginStore().message`; watch it in the dev-server tab's Console |
| The image you draw | `console.log(canvas.toDataURL())` and open the dataURL in a browser tab to see the frame |
| Build output | Inspect the generated `dist/manifest.json` and `dist/index.html` after `npm run build` |

## 9. Common error troubleshooting

| Symptom | Cause / check |
|---------|---------------|
| Plugin not in Craft's action list | `Plugin.UUID` invalid; Craft not restarted after first install; `manifest.cjs` syntax error (re-run `npm run dev` and read the terminal) |
| Action drags on but shows nothing | the action file name ≠ action `UUID`; the draw code threw — check the dev-server Console; `setImage` never called |
| Widget blank / wrong size | not reading `settings.ActionGeometry` each draw; canvas width/height of 0; drawing before `willAppear` set up settings |
| Widget will not resize | you tried `setSettings({ ActionGeometry })` (ignored) instead of drawing a new-sized canvas |
| Hot-reload stopped working | `npm run dev` (the Vite server) was stopped; restart it |
| Timer stops when Craft is in background | you used `setInterval`; switch to `plugin.Interval` / `Unterval` |
| PI shows blank | a JS error in the `.vue` page (check Console); `qtWebChannel` used outside Craft |
| Changes have no effect after build | the webview is still on the old bundle — reload the widget / restart Craft |
