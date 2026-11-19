# Pre-delivery self-check list

Go through this after finishing the plugin.

- [ ] Keep `script/craft-paths.cjs`; dev/build honor the configured Craft data directory and use the default if configuration.ini is absent

## Naming and structure

- [ ] `Plugin.UUID` in `manifest.cjs` is lowercase, no spaces
- [ ] Each action's `UUID` matches its `src/plugin/actions/<uuid>.ts` and `src/pages/actions/<uuid>.vue` file names
- [ ] `manifest.cjs` is valid JS (it is `require`d by `autofile.cjs`)
- [ ] The icon in `public/images/` exists and `Plugin.Icon` / action `Icon` resolve

## manifest.cjs

- [ ] Every action has `Settings.ActionGeometry { width, height }`
- [ ] Every action's `Controllers` is `['SecondaryScreen']`
- [ ] `UserTitleEnabled: false`, `SupportedInMultiActions: false`
- [ ] `i18n.en` is filled for the plugin and every action (other languages may fall back)

## Action draw logic (plugin/actions/<uuid>.ts)

- [ ] Only `willAppear` / `willDisappear` / `didReceiveSettings` are handled — no `keyUp`/`dialRotate`/etc.
- [ ] `draw()` reads `settings.ActionGeometry` for width/height (does not hardcode size)
- [ ] `setImage(canvas.toDataURL())` is actually called at the end of every draw
- [ ] `didReceiveSettings` triggers a redraw (handles both PI edits and on-screen resize)
- [ ] Timers use `plugin.Interval`; every one is `plugin.Unterval`'d in `willDisappear`
- [ ] No use of `setTitle` / `setState` / `showOk` / `showAlert` (no-ops on Craft)
- [ ] Size changes are done by drawing a new-sized canvas, never via `setSettings({ ActionGeometry })`
- [ ] `fetch`/draw code has `try/catch` and draws a visible error state on failure

## Property Inspector (pages/actions/<uuid>.vue)

- [ ] Form controls bind to `property.settings.*` (auto-persist)
- [ ] Default values are seeded (`onMounted`) so `v-model` has something to bind
- [ ] The PI does not try to write `property.settings.ActionGeometry`
- [ ] If the Coordinates card / `qtWebChannel` is unused, it is removed
- [ ] PI labels come from `src/hooks/i18n.ts`

## Build and run

- [ ] `npm install` (or `pnpm i`) succeeded
- [ ] `npm run dev` starts the Vite server and the widget renders in Craft
- [ ] Craft was restarted once after the first install
- [ ] Dragging the action onto the secondary screen shows the expected image
- [ ] Resizing the widget rescales the drawing correctly
- [ ] No errors in the dev-server Console
- [ ] (Only after user confirmation) `npm run build` produced `dist/index.html` + `dist/manifest.json`

## Deliverables

- [ ] Tell the user where the plugin folder is / that it was installed to Craft's plugins folder
- [ ] **Remind the user to restart Craft after the first install or any manifest change**
- [ ] If you could not build/install on this machine, include the install steps + paths from `build-and-debug.md`
- [ ] State which defaults you assumed (plugin name, placeholder icon, geometry, single language, colors)
