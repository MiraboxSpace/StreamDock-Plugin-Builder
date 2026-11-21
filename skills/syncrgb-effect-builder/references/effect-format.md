# Lighting effect format

This is the standalone SyncRGB lighting renderer format, not the separate
hardware-device plugin SDK. No local example installation is required.

```text
ColorWave/
├── ColorWave.html
├── ColorWave.svg
├── manifest.json
├── en.json
├── zh_CN.json
└── ... remaining supported language JSON files
```

Folder, HTML stem, icon stem and title token use the same English/alphanumeric
name. Use ASCII letters and digits for folder and file stems.

## HTML contract

Use top-level `<head>`, `<body>` and `<script>` sections, in that order, without
`<html>` or `</html>` wrappers. Do not style the HTML root: no `html { ... }`,
`html, body { ... }`, `:root { ... }`, or `document.documentElement.style`.
Body/canvas styling and other necessary HTML tags are allowed. Set body margin
to zero and keep the canvas fixed at 320 × 200 regardless of window size.
The HTML must be single-file, self-contained and require no build step, network
requests, external scripts/fonts or machine-specific absolute paths.

## Manifest

```json
{"author":"YourName","version":"1.0.0","icon":"ColorWave.svg","type":"normal"}
```

These keys are lowercase. There is no observed Action UUID, CodePath, Nodejs
or SDKVersion field. Keep the icon inside the effect folder. The source
template uses a 240 × 240 self-contained SVG with viewBox 0 0 240 240.
This is a cover icon, not the 320 × 200 sampled animation. Recompose a
representative moment for the square rather than stretching the canvas.
Use the effect's background, colors and shapes. No scripts, event handlers,
external URLs, linked images or fonts are allowed.

## Controls

The HTML head declares description, publisher, and property metadata:

```html
<meta property="bgColor" label="Background Color" type="color" default="#101020">
<meta property="lampSpeed" label="Lamp Speed" type="number" min="0" max="100" default="50">
<meta property="colorMode" label="Color Mode" type="combobox" values="Rainbow,Static Color" default="Rainbow">
<meta property="showLines" label="Show Lines" type="boolean" default="1">
```

Supported types are color, number, combobox, boolean and textfield:

| Type | Control | Attributes |
| --- | --- | --- |
| number | Slider and input | min, max, default |
| boolean | Toggle | default="0" or "1" |
| color | Color picker | default="#RRGGBB" |
| combobox | Dropdown | values="A,B,C", default="A" |
| textfield | Text input | default="..." |

Expose only a few parameters that improve the visual result. The property name is
the script setting; label and combobox values are localization keys. Treat
numbers/booleans defensively: the host may supply string or numeric values.
Every property must have a same-named global variable (a window property also
qualifies), read at runtime so control changes take effect without reloading.
Read window properties each frame. Set a fallback only if undefined, so an
already injected host value is not overwritten on load. Do not translate the
code's `Rainbow`/`Static Color` comparison tokens when translating the UI.

## Canvas and lifecycle

Use `<canvas id="exCanvas" width="320" height="200"></canvas>` and explicitly
set width=320 / height=200 on initialization. CSS sizing does not change the
backing buffer. Never multiply by devicePixelRatio or resize to the viewport.

Fill the full background in each frame so sampled pixels are intentional.
Use elapsed animation time, bound delta after pauses and preserve the image
when speed is zero. Maintain only one pending RAF, and cancel it in
stopAnimation. Reinitialization on resize keeps 320 × 200 and restarts once.
Read updated colors even while motion is paused. Avoid remote libraries,
unbounded object creation and unnecessary per-frame heavy work.

## Localization

Unlike Dock/Craft widget locale JSON, these dictionaries are flat maps:

```json
{"ColorWave":"彩色波纹","Background Color":"背景颜色","Rainbow":"彩虹"}
```

All 14 files need exactly the same keys: the title token, every property label
and every combobox value. There is no nested Localization or action UUID map.
Check exact spelling/case and nonempty values before first delivery. Include
the title mapping even for effects without configurable parameters.

### Optional generation-tool workflow

Only when the connected environment actually exposes a generation tool, pass
`coverSvg` on every generation call and supply `translations.en` and
`translations.zh_CN` together with the initial HTML. Both maps must cover the
title, all labels and all combobox options. This tool minimum does not replace
the 14 locale files required by this skill's local packaging workflow.

If that tool returns `needs_translations`, use the available
`patch_syncrgb_effect_translations` tool to merge only missing keys, for example:

```json
{"effectId":"existing-effect-id","translations":{"zh_CN":{"Speed":"速度"}}}
```

Keep the same effectId/UUID and effect root. Do not regenerate the effect or
resend HTML/SVG, or remove existing translations. Repeat only for reported
missing keys; completed drafts install and switch in the same directory.
Disk-backed drafts can be repaired after an MCP restart with the same effectId
and unchanged effect root. If these tools are unavailable, edit the local JSON
files and validate them; do not invent tool calls or UUIDs.
