# Pre-delivery self-check list

Go through this item by item after finishing the plugin.

## Naming and structure

- [ ] The plugin folder is named `com.<vendor>.streamdock.<name>.sdPlugin`, all lowercase
- [ ] `manifest.json` is valid JSON (no trailing commas, quotes paired)
- [ ] Each action's `UUID` is unique and prefixed with the plugin ID
- [ ] Each `plugin.<x>`'s `<x>` = the last segment of the matching action UUID
- [ ] For every action with a PI: `PropertyInspectorPath` points to an HTML file that actually exists
- [ ] The PI folder name matches the last UUID segment
- [ ] The icon files in `static/` actually exist and every `manifest` path resolves

## manifest

- [ ] `CodePathWin` / `CodePathMac` (or `CodePath`) points to `plugin/index.js`
- [ ] `OS` covers the target platforms
- [ ] `Software.MinimumVersion` is set (Windows ≥ 3.10.188.226 when using built-in Node)
- [ ] When using built-in Node, `Nodejs: { "Version": "20" }` is present
- [ ] Each action has at least 1 `States`

## Backend plugin/index.js

- [ ] Lifecycle events use the `_` prefix (`_willAppear` etc.); input events use the bare name (`keyUp` etc.)
- [ ] Every `setInterval` is cleared in `_willDisappear`
- [ ] The first argument of key-operating APIs is `context`
- [ ] Anywhere `settings` was changed, `setSettings` was called to persist it
- [ ] Exceptions have `try/catch` or an error callback; `showAlert` on failure
- [ ] SVG uses only SVG Tiny 1.2 features; colors use `rgb()`/color names, not `#`

## Property Inspector

- [ ] Content is inside `<div class="sdpi-wrapper">`
- [ ] Script order: `common.js → action.js → axios.js → index.js`
- [ ] `$propEvent.didReceiveSettings` echoes settings back into the form
- [ ] Form controls write back to `$settings` on change
- [ ] When `$local=true`, every language file's `Localization` is complete; otherwise `$local=false`

## Language files

- [ ] All 11 `<lang>.json` files are present (a missing one breaks the PI under that system language)
- [ ] The action key in every language file = the real action UUID
- [ ] `en.json` at least has fallback text filled in

## Build and run

- [ ] `npm install` in `plugin/` succeeded
- [ ] `npm run build` succeeded and produced `build/index.js`
- [ ] The StreamDock app has been restarted
- [ ] The plugin appears in the StreamDock actions list
- [ ] Dragged onto a key, the core feature works as required
- [ ] No unhandled exceptions in `plugin/log/`

## Deliverables

- [ ] Tell the user where the plugin folder is
- [ ] **Explicitly remind the user: restart the StreamDock app after installing/updating the plugin**
- [ ] If you could not build/install on this machine, include the install steps from `build-and-debug.md` (with the Win/Mac paths)
- [ ] State which default assumptions you made (vendor name, placeholder icon, single language, etc.)
