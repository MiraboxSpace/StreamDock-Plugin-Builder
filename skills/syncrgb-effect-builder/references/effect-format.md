# Lighting effect format

This format was inspected in the user's local `4th Dimension` effect under
HotSpot/SyncRGB/SDModules/mRGB/RGB. It is a lighting renderer, not the separate
SyncRGB hardware-device plugin SDK. Do not infer device APIs from it.

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
name. The original example uses spaces; new generated effects use the user's
stricter ASCII-alphanumeric convention.

## Manifest

```json
{"author":"YourName","version":"1.0.0","icon":"ColorWave.svg","type":"normal"}
```

These keys are lowercase. There is no observed Action UUID, CodePath, Nodejs
or SDKVersion field. Keep the icon inside the effect folder. The source
example uses a PNG; the user's requested default for new templates is a
240 × 240 self-contained SVG with viewBox 0 0 240 240. This is a cover icon,
not the 320 × 200 sampled animation. Verify SVG discovery in the target host;
if unsupported, use a verified 240 × 240 PNG fallback and explain the reason.

## Controls

The HTML head declares description, publisher, and property metadata:

```html
<meta property="bgColor" label="Background Color" type="color" default="#101020">
<meta property="lampSpeed" label="Lamp Speed" type="number" min="0" max="100" default="50">
<meta property="colorMode" label="Color Mode" type="combobox" values="Rainbow,Static Color" default="Rainbow">
<meta property="showLines" label="Show Lines" type="boolean" default="1">
```

Observed types are color, number, combobox and boolean. The property name is
the script setting; label and combobox values are localization keys. Treat
numbers/booleans defensively: the host may supply string or numeric values.
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
