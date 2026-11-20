# Craft plugin template (Vue 3 + TypeScript + Vite)

A minimal Craft secondary-screen plugin: one action draws a canvas (a text card
with a live clock) from its settings and pushes it with `setImage`.

## Install

```bash
npm install          # or: pnpm i
```

## Develop

```bash
npm run dev          # generates a dev manifest + starts the Vite dev server
```

The first time, restart the Craft app once so it loads the new plugin folder.
After that, edits hot-reload through the Vite dev server (`http://localhost:5173`).

This is a development version that depends on Vite. Test it and confirm it
works before requesting a production release.

## Build (final, installable)

```bash
npm run build        # single-file build + installs into Craft's plugins folder
```

The npm postbuild hook also creates `release/<plugin-id>.mPanelPlugin`.
Its ZIP contents start with manifest.json directly, without a wrapper folder
or `.zip` suffix. Share the installer with others or upload it to
https://space.mirabox.net/contentUpload. `npm run package` only recreates the
archive from existing dist files and does not build or install.

## Where things live

Both dev and build read `%APPDATA%/HotSpot/configuration.ini`, section
`[DeviceTypeDownNum]`, key `MiraBox%20Craft`, and install into `plugins`
under that data directory. If the file or value is absent, they use the
default `%APPDATA%/HotSpot/MiraBox Craft/plugins`. `CRAFT_PLUGINS_DIR` takes
precedence and points directly to a plugin root. Keep `script/craft-paths.cjs`
with the template.

| Path | What |
|------|------|
| `src/manifest.cjs` | plugin + action declaration (edit this, not `dist/manifest.json`) |
| `src/plugin/actions/<uuid>.ts` | per-action draw logic (`willAppear` / `didReceiveSettings` → draw → `setImage`) |
| `src/pages/actions/<uuid>.vue` | per-action Property Inspector form |
| `src/hooks/` | framework: WebSocket, action store, Worker timer, settings — do not modify |
| `script/autofile.cjs` | generates `manifest.json` + language files, installs to Craft |

The action file name, the PI file name, and the action `UUID` in `manifest.cjs`
must all match (e.g. `action1`).
