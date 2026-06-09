---
name: streamdock-plugin-builder
description: >-
  Use when the user wants to create, build, scaffold, or modify a StreamDock /
  Mirabox Stream Dock plugin — including manifest.json, the Node.js plugin
  backend, action handlers for keypad/dial/touchscreen buttons, or the Property
  Inspector settings UI. Triggers on requests like "write a StreamDock plugin",
  "make a Stream Dock plugin", "StreamDock plugin", or any text describing a
  button/dial behavior to run on a Stream Dock device.
version: 1.1.0
metadata: {"hermes": {"category": "development", "tags": ["streamdock", "mirabox", "plugin"]}}
---

# StreamDock Plugin Development

## Purpose

Turn a user's **plain-text request** into a complete, installable StreamDock
(Mirabox Stream Dock) plugin, starting from the bundled template.

**Core mental model: a plugin = one folder + event-driven messaging.**
The StreamDock app launches your backend code as a Node.js child process; the
two sides exchange JSON events over a local WebSocket. The user-facing settings
UI (the Property Inspector) is a separate HTML page.

## When to use

The user wants a plugin that triggers some behavior from a Stream Dock
key/dial (run a program, send a command, call an API, show dynamic info,
control volume, etc.).

## DEFAULT RULES — read before writing any build or install command

> **RULE 1 — always use `npm run dev` unless told otherwise.**
>
> The default install/test command is **`npm run dev`**, not `npm run build`.
> Only switch to `npm run build` when the user explicitly confirms the plugin
> is finished and working (e.g. "好了/没问题/可以打包/build/release/正式版").
> If the user says nothing about build mode, stay in dev mode.
> Never silently substitute `npm run build` for `npm run dev` during development.

> **RULE 2 — after every `npm run dev`, ask the user to test and confirm.**
>
> After running `npm run dev`, you MUST tell the user to open StreamDock,
> test the plugin, and report back. Do NOT run `npm run build` on your own
> initiative. Wait for the user to say it works before proceeding to the build.
> The handoff message must include:
> - What was changed
> - How to test it (which key/action to use)
> - An explicit prompt: "Please test in StreamDock and let me know when
>   everything looks good — I'll then run `npm run build` to create the final
>   installable bundle."

## Must-know conventions (the easiest mistakes)

1. **Plugin ID = folder name.** It must look like
   `com.<vendor>.streamdock.<name>.sdPlugin` — all lowercase, reverse-DNS.
2. **The `x` in `plugin.<x>` must equal the last segment of the action UUID.**
   Example: UUID `com.acme.streamdock.timer.start` → backend writes
   `plugin.start = new Actions(...)`. The SDK routes events with
   `action.split('.').pop()`; a name mismatch means that action receives no
   events at all.
3. **`context`** is the unique ID of "one key instance on the device." It is
   the first argument of almost every operation (`setImage / setTitle /
   setSettings`, etc.).
4. **Lifecycle events use the `_` prefix** (`_willAppear / _willDisappear /
   _didReceiveSettings / _propertyInspectorDidAppear`); **input events use the
   bare name** (`keyDown / keyUp / dialDown / dialUp / dialRotate / touchTap /
   sendToPlugin`). Reason: see `references/sdk-api.md`.
5. **Backend dependencies must be bundled.** The app's built-in Node has no
   `ws / log4js`; before shipping, run `npm run build` (ncc bundles to a single
   file).

## Development workflow (follow in order)

> **DEFAULT: use `npm run dev` at Step 7.** Only use `npm run build` when the
> user explicitly confirms the feature is complete and ready to ship. When in
> doubt, stay in dev mode.

### Step 1 — Clarify requirements

Map the user's plain-text request to plugin capabilities. **Answer the 6
questions below first.** Only ask the user when information is missing AND
affects implementation; otherwise pick a sensible default and state it.

| Question | What it drives |
|----------|----------------|
| What hardware triggers it? Standard key / dial (Knob) / touchscreen | `Controllers` in `manifest`, which events to use |
| What happens on press? Run program / command / HTTP / hotkey / open URL | the backend `keyUp` logic |
| What does the key display? Static icon / dynamic number / dynamic image | whether to use `setImage`/`setTitle`, whether a timer is needed |
| What does the user configure? (becomes the Property Inspector form) | PI form fields + `settings` keys |
| How many actions (key types) are needed? | length of the `manifest.Actions` array |
| Localization? Polling / timed refresh? | language files, `setInterval` |

See `references/requirement-mapping.md` for the full "requirement → capability"
decision table, and `references/recipes.md` for minimal code per common scenario.

### Step 2 — Copy the template and name it

1. Copy this skill's `assets/plugin-template/` to the user's chosen location
   (default: the current working directory).
2. **Rename** the copied folder to `com.<vendor>.streamdock.<name>.sdPlugin`.
3. Coupled spots in the template that must be **renamed together** (missing one
   breaks the action):
   - `manifest.json`: `Name / Description / Category / Author / URL`, each
     action's `UUID / Name / Tooltip`, `PropertyInspectorPath`
   - `plugin/index.js`: the `plugin.count` property name → the last segment of
     the new UUID
   - the `propertyInspector/count/` folder name → the same last segment
   - every `<lang>.json`: change the key `com.example.streamdock.counter.count`
     to the new UUID
   See the rename checklist in `references/build-and-debug.md`.

### Step 3 — Write manifest.json

Add/remove `Actions` per the requirements; set `Controllers`, `States`,
`Settings` defaults, `Software.MinimumVersion`, `Nodejs.Version`. Full field
reference: `references/manifest.md`.

### Step 4 — Write the backend `plugin/index.js`

Write one `plugin.<x> = new Actions({...})` per action and implement the events
you need. Available APIs (`setImage / setTitle / setState / setSettings /
showOk / showAlert / openUrl ...`) are in `references/sdk-api.md`; events and
payloads are in `references/events.md`.

### Step 5 — Write the Property Inspector

Put a form in `propertyInspector/<x>/index.html`; in `index.js` use
`$settings.xxx = ...` to write form values back to settings (auto-persisted).
See `references/property-inspector.md`. **If there is nothing to configure,
drop the PI**: remove `PropertyInspectorPath` from the manifest.

### Step 6 — Localization (optional)

The app loads `<lang>.json` by the system language. Edit the matching file when
you need to localize the plugin/action names. The template ships 11 language
files (`en`/`zh_CN` translated, the other 9 are English fallback copies; a
missing file breaks the PI under that system language, so keep all of them).
For automatic PI text translation, see the `$local` section of
`references/property-inspector.md`.

### Step 7 — Install dependencies, develop, and build

**First, verify Node.js and npm are available** on the user's machine:

```bash
node -v
npm -v
```

If either command is not found, tell the user to install **Node.js LTS** from
https://nodejs.org and restart their terminal before continuing. Do not proceed
until both commands succeed.

```bash
cd <plugin-folder>/plugin
npm install          # installs ws / log4js / fs-extra + @vercel/ncc build tool
```

If `npm install` fails due to network issues, retry with the Chinese mirror:

```bash
npm install --registry=https://registry.npmmirror.com
```

#### Standard development workflow

Follow this order unless the user specifically requests otherwise:

**① First run — `npm run dev` + restart StreamDock once**

```bash
npm run dev
```

`devfile.js` copies the plugin assets and a thin **launcher script** to the
StreamDock plugins folder. The launcher runs your development `index.js`
directly (no bundling needed).

**After the very first `npm run dev`, tell the user to restart the StreamDock
app once.** The app does not auto-detect newly added plugin folders; a restart
is needed to load the plugin for the first time. After that single restart, the
plugin is registered and StreamDock's crash-restart logic takes over.

**② Iterate — `npm run dev` after each backend change (no further restarts)**

Each subsequent `npm run dev` kills the old plugin process and StreamDock
immediately relaunches it with the latest source. No StreamDock app restart is
needed from this point on.

> ⚠ StreamDock allows **~50 consecutive plugin restarts** per session.
> `devfile.js` tracks the restart count in `PluginPath/plugin/.dev-restarts`
> and prints a warning when you run `npm run dev` if the count is ≥ 45.
> If the plugin stops responding, run `npm run dev` — it will tell you if the
> limit was hit — then **restart the StreamDock app** to reset the counter.

Test the feature after each change. Ask the user to confirm it works as
expected. Fix issues and repeat.

**③ User explicitly confirms → `npm run build` for the final bundle**

> **Do NOT run `npm run build` on your own.** Wait until the user says the
> plugin works (e.g. "好了", "没问题", "可以了", "looks good", "works fine").
> If the user has not confirmed, keep iterating in dev mode.

Once the user confirms:

```bash
npm run build
```

`npm run build` runs `ncc` twice — bundling `index.js` into `build/index.js` and
`keepalive.js` into `build-keepalive/index.js` — then `autofile.js` installs via
a **keep-alive handoff** when the plugin is already running:
1. Writes the keep-alive bundle over the installed (running) `plugin/index.js`.
2. Kills the running process **once** → StreamDock relaunches the keep-alive.
3. The keep-alive connects to StreamDock, copies the real files in, overwrites
   itself with the production bundle, and exits → StreamDock relaunches the final
   version.
4. `autofile.js` waits for the keep-alive's `done` marker, so `npm run build`
   blocks until the new version is live.

This costs ~2 of StreamDock's **50 per-plugin restart budget** (reset on app
restart) and avoids the old crash-loop where deleting `index.js` mid-install
burned the whole budget and killed the plugin. Full rationale:
`references/build-and-debug.md`.

**No manual StreamDock restart is required** when transitioning from dev to
build mode — the keep-alive hands off to the new bundle automatically.

> Exception: if `npm run build` is run **without** a prior dev session (cold
> install, no plugin was running), there is nothing to hand off from, so
> `autofile.js` does a plain in-place copy and **tells the user to restart the
> StreamDock app manually**. It prints the appropriate message automatically.

> **If the plugin stops working after `npm run build`** (no response, blank
> key, or action missing from the list), it is usually a `manifest.json` change.
> The keep-alive handoff only reloads the plugin **process** — whether the new
> `manifest.json` (UUID, action list, Controllers, States, PropertyInspectorPath,
> etc.) is picked up depends on the StreamDock version:
> - **after `3.10.202.0512`** — manifest hot-reload is implemented, so a build/dev
>   with manifest changes is loaded without restarting the app;
> - **`3.10.202.0512` and earlier** — manifest is only read at app startup, so any
>   manifest change still requires a **full StreamDock restart**.
>
> When in doubt (or targeting older versions), tell the user to restart the
> StreamDock app after a manifest change.

If you cannot build (no npm / not the target machine), deliver the whole
`.sdPlugin` folder to the user and include the install steps from
`references/build-and-debug.md` (with the Windows/macOS plugins folders).

### Step 8 — Debug and verify

Restart the StreamDock app so it picks up the new plugin; debug with the
methods in `references/build-and-debug.md` (`localhost:23519`, the
`plugin/log/` log file). Self-check against `references/checklist.md` before
delivery.

## Reference index

| File | Contents |
|------|----------|
| `references/architecture.md` | Plugin structure, process/WebSocket model, registration handshake |
| `references/manifest.md` | Full `manifest.json` field reference |
| `references/events.md` | All received/sent events with JSON payloads |
| `references/sdk-api.md` | The bundled `Plugins/Actions/log` API and the front-end API |
| `references/property-inspector.md` | PI development: forms, settings persistence, file picker, i18n |
| `references/build-and-debug.md` | Naming/rename checklist, build, install paths, debugging |
| `references/requirement-mapping.md` | "User requirement → plugin capability" decision table |
| `references/recipes.md` | Minimal working code for common scenarios |
| `references/checklist.md` | Pre-delivery self-check list |

## Common mistakes

| Mistake | Consequence / fix |
|---------|-------------------|
| `plugin.<x>` name ≠ last segment of the UUID | the action receives no events; make them match |
| Defining `willAppear` instead of `_willAppear` | overrides the SDK interceptor, `this.data` stops working |
| Shipping without `npm run build` | the app's built-in Node cannot find `ws`; the plugin fails to start |
| `setImage` given a non-existent image path | blank key; use an SVG dataURL or verify the `static/` path |
| SVG dataURL not URL-encoded | blank key; the app URL-decodes the dataURL once, so wrap the SVG in `encodeURIComponent(svg)` |
| SVG uses filters / CSS / shadows or other advanced features | blank key; StreamDock only supports SVG Tiny 1.2, see `references/recipes.md` |
| Forgetting to tell the user to restart StreamDock | plugin does not appear / does not update; the app must be restarted after a build |
| `npm run build` fails with a file-in-use / EBUSY error | A watcher/antivirus is holding the installed `plugin/index.js` during the keep-alive swap. Tell the user: **quit StreamDock first, then re-run `npm run build`** (the not-running path copies plainly) |
| `npm run build` prints "Timed out waiting for the keep-alive" | the keep-alive did not finish in ~15 s; check `plugin/log/keepalive.log` in the installed plugin folder, and if needed quit/reopen StreamDock and build again |
| PI text has `$local=true` but a language file is missing keys | the UI shows "undefined"; fill in the keys or set `$local=false` |
| Folder name is not in `com.*.sdPlugin` form | the app does not recognize the plugin |
