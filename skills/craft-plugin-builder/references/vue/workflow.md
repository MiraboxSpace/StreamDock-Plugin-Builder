---
name: craft-plugin-builder
description: >-
  Use when the user wants to create, build, scaffold, or modify a MiraBox Craft
  plugin — a secondary-screen (副屏) widget built from the Vue 3 template:
  manifest.cjs, the canvas drawing logic for an action, and the Property
  Inspector settings UI. Triggers on requests like "write a Craft plugin",
  "make a MiraBox Craft plugin", "Craft 副屏插件", or any text describing
  something to display on the Craft secondary screen.
metadata: {"hermes": {"category": "development", "tags": ["craft", "mirabox", "plugin", "secondary-screen"]}}
---

# MiraBox Craft Plugin Development

For release delivery, also follow `../packaging.md`: label each dev delivery
as a development version, ask the user to test and confirm, then complete
production build + active-directory installation + installer generation when
requested. Always provide the shareable `.mPanelPlugin` file (ZIP with no
wrapper directory) and https://space.mirabox.net/contentUpload. Compiling with
Vite alone is not a production delivery.

## Purpose

Turn a user's **plain-text request** into a complete, installable **MiraBox
Craft** plugin, starting from the bundled Vue template.

**Core mental model: a Craft plugin is a Vue app whose only job is to draw a
picture.** Craft is a *secondary display* — a screen with **no input events**.
Each action is a widget the user drags onto that screen. Your plugin reads the
widget's `settings`, draws a canvas the size of `settings.ActionGeometry`, and
pushes it to the screen with `setImage`. When settings change you get one event,
`didReceiveSettings`, and you redraw. Plugins may also send `lightControl` to
show or hide a screen-level warning effect, typically when CPU load or
temperature crosses a threshold.

## When to use

The user wants to **show something** on the Craft secondary screen — a clock, a
dashboard, live data, an image, an animation, a status card. If the request
involves pressing/turning/tapping or running programs, that is StreamDock, not
Craft (see `streamdock-plugin-builder`).

## What Craft does NOT have (read this first)

Craft is display-only. The following StreamDock concepts **do not exist** — do
not write code for them:

- **No input events:** no `keyDown` / `keyUp`, no `dialDown` / `dialUp` /
  `dialRotate`, no `touchTap`.
- **No title system:** no `setTitle`, no `titleParametersDidChange`, no user
  titles. Want text? Draw it on the canvas.
- **No states / OK / alert:** no `setState`, no `showOk`, no `showAlert`.
- **No device / app / system events:** no `deviceDidConnect`,
  `applicationDidLaunch` / `applicationDidTerminate`, `systemDidWakeUp`.

**The only events an action receives are `willAppear`, `willDisappear`, and
`didReceiveSettings`.** Normal widget output uses `setImage`; threshold/status
plugins can additionally use `lightControl` for a screen-level visual alarm.
Full output list and the light-effect payload are in `references/events.md` and
`references/sdk-api.md`.

## DEFAULT RULES — read before writing any build or install command

> **RULE 1 — always use `npm run dev` unless told otherwise.**
>
> The default develop/test command is **`npm run dev`**, not `npm run build`.
> Only switch to `npm run build` when the user explicitly confirms the plugin is
> finished and working (e.g. "好了/没问题/可以打包/build/release/正式版"). If
> the user says nothing about build mode, stay in dev mode.

> **RULE 2 — after every `npm run dev`, ask the user to test and confirm.**
>
> After running `npm run dev`, tell the user to open Craft, look at the widget
> on the secondary screen, and report back. Do NOT run `npm run build` on your
> own initiative. The handoff message must include:
> - What was changed
> - How to test it (drag which action onto the screen, what to look for)
> - An explicit prompt: "Please test in Craft and let me know when it looks good
>   — I'll then run `npm run build` to create the final installable bundle."

## Must-know conventions (the easiest mistakes)

1. **Plugin id = `com.mirabox.streamdock.<name>`**, installed as the folder
   `com.mirabox.streamdock.<name>.mPanelPlugin`. You only set `<name>` via
   `Plugin.UUID` in `src/manifest.cjs`; the prefix and folder suffix are added
   automatically by `script/autofile.cjs`.
2. **An action's file names must match its UUID.** For action UUID `action1`:
   the draw logic is `src/plugin/actions/action1.ts` and the PI is
   `src/pages/actions/action1.vue`. The runtime registers actions by file name
   and routes the PI by `argv[4].action.split('.').pop()`; a mismatch means the
   action draws nothing or the PI fails to load.
3. **`context`** is the unique id of "one widget instance on the screen." It is
   the key into the action store: `plugin.getAction(context)` →
   `.setImage / .setSettings / .settings`.
4. **`settings.ActionGeometry { width, height }` is the canvas size to draw at**
   — and it is REQUIRED in every action's `Settings` in `manifest.cjs`. It is
   the **only** settings field `setSettings` cannot change. To resize, draw a
   different-sized canvas and Craft updates the geometry for you. When the user
   resizes the widget on screen, you receive `didReceiveSettings` carrying the
   new `ActionGeometry` — just redraw at the new size. (Details:
   `references/recipes.md` → "ActionGeometry".)
5. **Draw with `<canvas>` → `toDataURL()` → `setImage`.** Canvas is the
   recommended renderer (SVG dataURLs also work). Keep redrawing at the current
   `ActionGeometry` size.
6. **Use `plugin.Interval / plugin.Unterval` for timers**, not `setInterval`.
   They run on a Web Worker so they keep firing when the Craft webview is in the
   background. Always `Unterval` in `willDisappear`.
7. **Use Craft's file selector for user-uploaded files.** In the PI, call
   `qtWebChannel.qtObject.openFileSelectorNew(UUID, count, fileType)` instead of using
   a plain browser file input when the file should be packaged with the scene.
   Craft copies selected files into the scene folder, so exported scenes carry
   them. Receive the result through `qmlMessage`, store only the returned file
   name/path segment in `property.settings`, and call `deleteFile` for the old
   stored file when replacing it. Details and example:
   `references/property-inspector.md` → "Uploading files".
8. **Use `plugin.lightControl(...)` only for meaningful screen-level alerts.**
   For CPU, temperature, or similar thresholds, send `active: true` only when
   entering the alarm state and `active: false` when leaving it. Also turn it
   off in `willDisappear` if that widget owns the alarm. Payload and example:
   `references/events.md` → "Screen light effect".

## Development workflow (follow in order)

> **DEFAULT: use `npm run dev` at Step 7.** Only use `npm run build` once the
> user confirms the feature is complete. When in doubt, stay in dev mode.

### Step 1 — Clarify requirements

Map the request to a drawing. Answer these first; only ask the user when a
missing point actually blocks implementation, otherwise pick a sensible default
and state it.

| Question | What it drives |
|----------|----------------|
| What should the widget show? (text / number / chart / image / animation) | the `draw()` canvas code |
| Where does the data come from? (static, user input, `fetch` from an API, time) | whether a refresh loop / `fetch` is needed |
| What can the user configure? | the Property Inspector fields + `settings` keys |
| Does it update over time? How often? | `plugin.Interval` cadence |
| How many distinct widgets (actions)? | number of entries in `manifest.cjs` `Actions` |
| Localization? | `src/hooks/i18n.ts` + `manifest.cjs` `i18n` |

See `references/requirement-mapping.md` for the full decision table and
`references/recipes.md` for ready-to-adapt drawing snippets.

### Step 2 — Copy the template and name it

1. Copy this skill's `assets/plugin-template/` to the user's chosen location
   (default: current working directory).
2. Set `Plugin.UUID` in `src/manifest.cjs` to the plugin short name (e.g.
   `weather`). The installed folder becomes
   `com.mirabox.streamdock.weather.mPanelPlugin` automatically.
3. For each action, keep the three names in sync — the `UUID` in `manifest.cjs`,
   `src/plugin/actions/<uuid>.ts`, and `src/pages/actions/<uuid>.vue`. See the
   rename checklist in `references/build-and-debug.md`.

### Step 3 — Edit `src/manifest.cjs`

Add/remove entries in `Actions`; set each action's `i18n` names, `Controllers`
(`['SecondaryScreen']`), and **`Settings.ActionGeometry`** default size. Field
reference: `references/manifest.md`.

### Step 4 — Write the action draw logic

In `src/plugin/actions/<uuid>.ts`, handle `willAppear` / `didReceiveSettings`
(redraw) and `willDisappear` (stop the timer). The `draw()` function reads
`settings.ActionGeometry`, paints a canvas, and calls
`plugin.getAction(context).setImage(canvas.toDataURL())`. APIs:
`references/sdk-api.md`. Drawing recipes: `references/recipes.md`.

### Step 5 — Write the Property Inspector

In `src/pages/actions/<uuid>.vue`, bind form controls to `property.settings.*`.
Assigning to `property.settings` auto-persists (debounced) and the action side
receives `didReceiveSettings`. See `references/property-inspector.md`. If there
is nothing to configure, the PI can be a near-empty form (Craft always loads a
PI page). For user-selected images/audio/data files that must be included when
the user exports a scene, use Craft's Qt file selector from the PI instead of a
native `<input type="file">`; see "Uploading files" in
`references/property-inspector.md`.

### Step 6 — Localization (optional)

PI labels live in `src/hooks/i18n.ts` (keyed by `argv[3].application.language`).
Plugin/action names live in `manifest.cjs` `i18n` and are emitted to each
`dist/<lang>.json` by `autofile.cjs`. See `references/property-inspector.md`.

### Step 7 — Install dependencies, develop, and build

**First, verify Node.js and npm are available:**

```bash
node -v
npm -v
```

If either is missing, tell the user to install **Node.js LTS** from
https://nodejs.org and restart the terminal. Then:

```bash
cd <plugin-folder>
npm install          # or: pnpm i   (the template is pnpm-flavored but npm works)
```

If install fails on network, retry with the mirror:
`npm install --registry=https://registry.npmmirror.com`.

**① Develop — `npm run dev`**

```bash
npm run dev
```

`script/autofile.cjs dev` writes a dev manifest (pointing Craft at the Vite dev
server via `_.html`) and copies it into Craft's plugins folder; then Vite serves
the app at `http://localhost:5173`. **After the very first `npm run dev`,
restart the Craft app once** so it loads the new plugin folder. From then on,
edits hot-reload in the widget automatically — no restart needed.

Test after each change and ask the user to confirm (RULE 2).

**② User confirms → `npm run build`**

```bash
npm run build
```

`vite build` produces a single-file `dist/index.html`; `autofile.cjs` then
generates `manifest.json` + language files and installs the bundle into Craft's
plugins folder. Tell the user to reload the widget (or restart Craft) to pick up
the production build. Full details + paths: `references/build-and-debug.md`.

### Step 8 — Debug and verify

Debug the running webview with the methods in `references/build-and-debug.md`.
Self-check against `references/checklist.md` before delivery.

## Reference index

| File | Contents |
|------|----------|
| `references/architecture.md` | Plugin structure, the one-app-two-roles model, WebSocket registration |
| `references/manifest.md` | `manifest.cjs` source + generated `manifest.json` fields, `ActionGeometry`, `SecondaryScreen` |
| `references/events.md` | Events Craft sends/receives, including the `lightControl` screen effect |
| `references/sdk-api.md` | The `usePluginStore` / `usePropertyStore` API, the Worker timer |
| `references/property-inspector.md` | PI development: Vue forms, settings auto-persist, coordinates, i18n |
| `references/build-and-debug.md` | Naming/rename checklist, dev vs build, install paths, debugging |
| `references/requirement-mapping.md` | "User requirement → drawing/config" decision table |
| `references/recipes.md` | Canvas drawing recipes, ActionGeometry resize, polling, fetch-and-draw |
| `references/checklist.md` | Pre-delivery self-check list |

## Common mistakes

| Mistake | Consequence / fix |
|---------|-------------------|
| Writing `keyUp` / `dialRotate` / `setTitle` / `setState` handlers | They never fire / do nothing on Craft; use `didReceiveSettings` + `setImage` |
| Action file name ≠ action UUID last segment | The action never draws, or the PI page fails to load |
| Missing `ActionGeometry` in an action's `Settings` | The widget has no default size; always include `{ width, height }` |
| Trying to change size via `setSettings({ ActionGeometry })` | Ignored — instead draw a canvas of the new size and Craft updates the geometry |
| Drawing at a fixed size, ignoring `settings.ActionGeometry` | The widget does not resize; always read width/height from settings each draw |
| Using `setInterval` for refresh | Throttled when the webview is backgrounded; use `plugin.Interval` / `Unterval` |
| Forgetting `plugin.Unterval` in `willDisappear` | Timer leaks and keeps drawing for a removed widget |
| Using `<input type="file">` for scene assets | The file is not copied into the scene folder; use `qtWebChannel.qtObject.openFileSelectorNew(...)` and persist the returned scene file name |
| Editing `dist/manifest.json` by hand | Overwritten on next build; edit `src/manifest.cjs` instead |
| Forgetting to restart Craft after the first install / a manifest change | The plugin/action does not appear; restart Craft once |
