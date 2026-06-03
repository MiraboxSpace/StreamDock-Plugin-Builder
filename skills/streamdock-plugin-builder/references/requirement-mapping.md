# Requirement → capability decision table

Translate the user's plain-text request into concrete manifest config and
backend code choices.

## 1. What hardware interaction is this?

| Words in the user's description | Controllers | Main events |
|---------------------------------|-------------|-------------|
| "press", "click the button" | `["Keypad"]` | `keyUp` (or `keyDown`) |
| "dial", "rotate", "adjust", "volume knob" | `["Knob"]` | `dialRotate` `dialDown` `dialUp` |
| "the small screen on the dial", "touchscreen" | `["Knob"]` | `touchTap` + the ones above |
| "just show info, no pressing" | `["Information"]` | only `_willAppear` + timed refresh |

## 2. What happens on press?

| Requirement | Implementation |
|-------------|----------------|
| Open a web page | `plugin.openUrl(url)` |
| Run a program / shell command | `require('child_process').exec(...)` (a Node child process — anything Node can do) |
| Simulate a keypress / hotkey | call a system command or third-party tool (e.g. `nircmd` or PowerShell on Windows) |
| Call an HTTP API | `fetch` (built into Node 20) or the bundled front-end `axios` |
| Control system volume / brightness | call a system command (platform-specific), `exec` it inside `keyUp` |
| Multi-state on/off toggle | configure 2 `States` in the `manifest` + `plugin.setState(context, 0/1)` |
| Counting / accumulation | store in `settings`, persist with `setSettings` |

> The backend is a full Node.js environment — filesystem, network, child
> processes are all available. For complex capabilities, prefer
> `child_process` to call system commands or existing CLI tools.

## 3. What does the key display?

| Requirement | Implementation |
|-------------|----------------|
| Fixed icon | point `manifest`'s `States[].Image` at an image in `static/` |
| One simple line of plain text (and you don't care about layout/color) | `plugin.setTitle(context, text)` |
| Numbers, time, content with color or layout, graphics | generate SVG → `plugin.setImage(context, 'data:image/svg+xml;charset=utf8,'+encodeURIComponent(svg))` |
| Real-time refresh (update every second) | `setInterval` in `_willAppear`, `clearInterval` in `_willDisappear` |
| Different image per state | multiple `States` + `setState`, or just swap the image with `setImage` |

**How to choose setTitle vs setImage:**

- `setTitle` is the least effort, but its styling is limited by
  `States[].FontSize/TitleColor/TitleAlignment` in the `manifest`, and it
  conflicts with a "user custom title." Only suitable for one simple line of
  text.
- To fully control the appearance (color, font size, layout, graphics, progress
  bars), use `setImage` + SVG. **This skill recommends: for anything beyond the
  simplest plain text, always use an SVG dataURL** — no image files to bundle,
  canvas about 144×144.
- When self-drawing with `setImage`, set the action's
  `UserTitleEnabled: false` in the `manifest` so a user title does not overlay
  your drawn content; `States[].FontSize` etc. have no effect then and can stay
  at defaults.
- **URL-encode the SVG** with `encodeURIComponent(svg)` before putting it in the
  data URI — StreamDock runs one URL-decode on the value, so a raw `#`/`%`/`<`/
  space would otherwise be mis-decoded and the key renders blank.
- StreamDock's SVG renderer only supports the **SVG Tiny 1.2 subset**: no
  `<style>`/CSS, filters, shadows, `paint-order`, etc. See the "SVG rendering
  limits" section of `recipes.md` for the full allowed/forbidden list.

## 4. What does the user configure? → Property Inspector

List the "adjustable parameters" from the user's description; each parameter =
one form control in the PI + one `settings` key:

| Parameter kind | Control |
|----------------|---------|
| Text (URL, path, message) | `<input type="text">` |
| Number (interval, threshold, volume) | `<input type="num">` |
| Toggle | `<input type="checkbox">` |
| One-of-many (mode, device) | `<select>` |
| Pick a file | `<input type="file">` |
| Multi-line text | `<textarea>` |

No adjustable parameters at all → no PI (remove `PropertyInspectorPath`).

## 5. How many actions are needed?

- The number of **distinct key behaviors** in the user's description = the
  number of actions. Example: "a start button, a stop button, a button showing
  elapsed time" = 3 actions.
- Same behavior, only different parameters (e.g. "open different URLs") = **1
  action**, configured via the PI.

## 6. Timers / polling?

| Requirement | Implementation |
|-------------|----------------|
| The key display needs periodic refresh (clock, monitor) | `setInterval` in `_willAppear`, store the timer keyed by `context`, clear it in `_willDisappear` |
| Periodically fetch remote data | same as above; in the callback, `fetch` then `setImage/setTitle` |

**Always clear the timer in `_willDisappear`**, or it keeps running after the
key is removed and leaks memory.

## 7. Localization?

- The user explicitly wants multi-language → see the `$local` section of
  `property-inspector.md` and fill in every `<lang>.json`.
- Not mentioned → single language; set `$local=false` in the PI and let the
  language files use English fallback.

## When information is missing

If a **key point that affects implementation** is missing from the user's
description (hardware type, the exact press behavior, what to display) and you
cannot pick a sensible default, then ask the user. Anything you can default
(placeholder icon, `com.example` as the vendor, single language) — default it
and state so on delivery.
