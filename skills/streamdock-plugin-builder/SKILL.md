---
name: streamdock-plugin-builder
description: >-
  Use when the user wants to create, build, scaffold, or modify a StreamDock /
  Mirabox Stream Dock plugin — including manifest.json, the Node.js plugin
  backend, action handlers for keypad/dial/touchscreen buttons, or the Property
  Inspector settings UI. Triggers on requests like "write a StreamDock plugin",
  "make a Stream Dock plugin", "StreamDock plugin", or any text describing a
  button/dial behavior to run on a Stream Dock device.
version: 1.0.0
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

### Step 7 — Install dependencies, build, install

```bash
cd <plugin-folder>/plugin
npm install
npm run build      # ncc bundle + autofile.js auto-copies into the StreamDock plugins folder
```

`autofile.js` supports both **Windows and macOS** and picks the plugins folder
automatically by OS.

**After build/install completes, you MUST explicitly remind the user to restart
the StreamDock app** — it only loads or refreshes plugins on restart. Put this
in the hand-off notes you give the user.

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
| `npm run build` fails with a file-in-use / EBUSY error | StreamDock is running and still holds a lock on the previously installed plugin; `autofile.js` cannot delete the old copy. Tell the user: **quit StreamDock first, then re-run `npm run build`** |
| PI text has `$local=true` but a language file is missing keys | the UI shows "undefined"; fill in the keys or set `$local=false` |
| Folder name is not in `com.*.sdPlugin` form | the app does not recognize the plugin |
