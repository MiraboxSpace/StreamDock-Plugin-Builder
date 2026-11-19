# Requirement → capability decision table

Craft plugins only **display**. Translate the user's request into "what to draw,
from what data, configured how, refreshed how often."

## 1. What does the widget show? → the `draw()` canvas code

| Requirement | Implementation |
|-------------|----------------|
| Static text / a label | draw text on a canvas sized to `ActionGeometry`, `setImage` once |
| A number / clock / countdown | draw text, refresh with `plugin.Interval` |
| Live data (weather, prices, stats) | `fetch` in the refresh loop, then draw |
| An image / icon / logo | `drawImage` an `HTMLImageElement` onto the canvas |
| A chart / progress bar / gauge | draw shapes (`fillRect`, `arc`, `lineTo`) on the canvas |
| An animation | redraw on a fast `plugin.Interval` (e.g. 16–100 ms) |
| Different layouts by mode | branch in `draw()` on a `settings.mode` value |

Everything is "build a canvas, `setImage(canvas.toDataURL())`." Full HTML5
canvas is available (gradients, shadows, fonts, compositing) — it is a real
Chromium webview.

## 2. Where does the data come from?

| Source | Implementation |
|--------|----------------|
| Fixed / from user settings | read `plugin.getAction(context).settings` |
| The current time | `new Date()` in the draw loop |
| A web API | `fetch(url)` inside the refresh callback (CORS applies — the webview is a browser) |
| Computed from other settings | compute in `draw()` |

> No filesystem, no child processes, no system APIs — this is a browser webview,
> not Node. If the user needs to run programs or read local files, that is a
> StreamDock plugin, not Craft.

## 3. Sizing → always honor `ActionGeometry`

- Read `settings.ActionGeometry.width/height` at the **start of every `draw()`**.
- Design in a fixed "base" coordinate space and scale to the current width if
  you want resolution-independent layout (`ctx.scale(W / BASE_W, ...)`), or just
  compute positions from `W`/`H` directly.
- To change the widget's size yourself, draw a canvas of the new size — Craft
  adopts it. Never push size through `setSettings`.
- Handle on-screen resize: it arrives as `didReceiveSettings` with a new
  `ActionGeometry`; your redraw already uses it, so just redraw.

## 4. What can the user configure? → Property Inspector

Each adjustable parameter = one control in `pages/actions/<uuid>.vue` + one
`settings` key. See `property-inspector.md` for the control table. No adjustable
parameters → a near-empty PI (Craft still loads one).

## 5. How many actions?

- Each **distinct widget type** in the request = one action (one `Actions`
  entry + `actions/<uuid>.ts` + `pages/actions/<uuid>.vue`).
- Same widget, different content via settings (e.g. "show any city's weather") =
  **one** action, configured in the PI.

## 6. Refresh / animation?

| Requirement | Implementation |
|-------------|----------------|
| Periodic update (clock, monitor, polling) | `plugin.Interval(ActionID+context, ms, () => draw(context))` in `willAppear`, `plugin.Unterval(...)` in `willDisappear` |
| One-shot static render | draw once in `willAppear`; no timer |
| Smooth animation | small interval (e.g. 33 ms ≈ 30 fps); keep frame state in a module-level map keyed by `context` |

**Always `Unterval` in `willDisappear`**, or a removed widget keeps redrawing.
Use `plugin.Interval`, not `setInterval` (background-tab throttling).

## 7. Localization?

- PI labels → `src/hooks/i18n.ts`.
- Plugin/action names in Craft's list → `manifest.cjs` `i18n`.
- Not mentioned → fill `en`, optionally `zh_CN`; the rest fall back to English.

## When information is missing

If a point that blocks implementation is missing (what to display, where the
data comes from, refresh rate) and you cannot pick a sensible default, ask.
Anything defaultable (placeholder icon, `680×460` geometry, single language,
neutral colors) — default it and say so on delivery.
