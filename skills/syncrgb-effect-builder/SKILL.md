---
name: syncrgb-effect-builder
description: >-
  Create or modify SyncRGB / MiraBox Craft RGB lighting effects as standalone
  HTML Canvas plugins with meta settings, a manifest, a 240x240 SVG icon and flat
  localization JSON files. Use for RGB animations and lighting effects, not
  hardware device drivers, StreamDock button actions or Craft screen widgets.
---

# SyncRGB Lighting Effect Development

Start from `assets/effect-template/ColorWave/`, a self-contained wave renderer.
No local example or preinstalled effect is required. The host samples the
canvas; there is no Dock/Craft WebSocket
registration, setImage, ActionGeometry, Property Inspector, Node backend or
Vite build in this effect format.

## Essential rules

- Use top-level `<head>`, `<body>` and `<script>` sections, without opening or
  closing `<html>` tags. Do not style the root element with `html`, `html, body`,
  `:root`, or `document.documentElement.style`. Set zero margin, background and
  overflow on body or canvas only.
- Keep the effect HTML single-file and self-contained, without a build step,
  network requests, external scripts/fonts or machine-specific absolute paths.
- **Canvas backing size is always exactly 320 × 200.** Keep both HTML width/
  height attributes and runtime assignments fixed. Do not use innerWidth,
  innerHeight, clientWidth, devicePixelRatio or host payload dimensions.
  Offscreen rendering surfaces, if added, must also stay 320 × 200.
- Choose a unique folder name using **ASCII letters and digits only**, e.g.
  `ColorWave` or `AuroraFlow2`. Use that name for the HTML filename, SVG icon,
  title key and all language dictionaries. Avoid spaces, hyphens and Chinese
  characters in the folder/file stem; display names may be translated freely.
- The host derives controls from `meta property/label/type/default` tags and
  updates matching window globals. Read settings on each frame, preserve host
  values, and provide defaults so the HTML can render outside the host.
- Use one requestAnimationFrame chain; expose stopAnimation for cleanup.
  Clear or cover the entire canvas every frame: colors must cover the sampled
  image, not just decorative UI. Reuse objects/gradients where practical; avoid
  large per-frame allocations, DOM creation and new timers.
  Restarting or resizing must not multiply loops or change the canvas size.
  Do not suppress renderer exceptions with an empty catch block.
- Include a lowercase manifest (`author`, `version`, `icon`, `type: normal`)
  and a **240 × 240 SVG cover**, with viewBox 0 0 240 240. This cover is
  independent of the 320 × 200 animation canvas. Point icon to the SVG.
  Recompose the representative animation moment for a square cover rather
  than stretching the rectangular canvas. Match the effect's colors and shapes.
  Do not copy Dock's manifest schema into this format.
- Include 14 flat translation dictionaries: de, el, en, es, fr, it, ja, ko,
  pl, pt, ru, tr, zh_CN and zh_HK. Translate the effect name, control labels
  and combobox values; preserve internal combobox tokens in the HTML/code.
  Deliver all dictionaries with the first generated effect, including title
  translations even when there are no controls. See the reference for optional
  generation-tool translation repair; the local file workflow still needs 14 locales.

## Workflow

1. Translate the requested appearance into colors, shapes, motion and a few
   useful controls. Use the minimal template if no exact effect is specified.
2. Copy the ColorWave folder to a working project, rename all coupled files
   and keys if needed, and edit the animation/meta tags. See
   `references/effect-format.md` for the evidence-backed contract.
3. Draw a self-contained 240 × 240 SVG icon matching the effect's visual theme.
   Do not embed raster images, external resources, scripts or fonts. Check
   that it is nonblank and keep its size separate from the animation canvas.
4. Check Python and Node availability. Run
   `python <skill>/scripts/effect.py validate <effect-folder>` to validate
   names, manifest, primary canvas, cover, translations and JavaScript syntax.
   Also exercise the animation, settings changes, speed zero, stop/restart,
   and resize behavior; syntax checks do not prove runtime rendering.
5. Install with `python <skill>/scripts/effect.py install <effect-folder>`.
   The helper reads the Craft data directory from
   `%APPDATA%/HotSpot/configuration.ini`, then appends `SDModules/mRGB/RGB`.
   Without a file/key/value it uses
   `%APPDATA%/HotSpot/MiraBox Craft/SDModules/mRGB/RGB`. An explicit `--root`
   overrides this for a verified SyncRGB installation or isolated testing.
   Do not silently install to the original SyncRGB example directory when
   configuration points Craft elsewhere. See `references/install-and-share.md`.
   If `%APPDATA%/HotSpot/SyncRGB/SDModules/mRGB/RGB` also exists, the helper
   installs a second copy there. It deduplicates identical resolved paths.
   `--root` deliberately disables automatic multi-target installation.
6. **There is no development/production mode for lighting effects.** After
   installation tell the user the actual path and to **restart the software**
   so it discovers the new effect, then select it and test its controls.
   Do not ask for production-build confirmation or run npm dev/build.
7. Also create a shareable copy after the validated installation: run
   `python <skill>/scripts/effect.py package <effect-folder>` and provide the
   resulting `.mRGBEffect` installer link. Its contents are ZIP data with the
   HTML, SVG, manifest and translations directly at root, without an enclosing
   effect folder or a `.zip` suffix. Exclude existing installers from the package.
   Install unpacked effect files in each RGB target, not the installer itself.
   Explain that users can share the installer or publish it at
   https://space.mirabox.net/contentUpload; do not upload unless asked.

The script refuses to overwrite an existing effect unless `--replace` is
explicitly supplied. Use it only for an intended update; no unrelated effects,
host configuration, device layouts or running processes should be changed.

## References

- `references/effect-format.md`: file structure, metadata, settings and animation.
- `references/install-and-share.md`: configuration resolution, installation,
  validation, ZIP delivery and restart handoff.
