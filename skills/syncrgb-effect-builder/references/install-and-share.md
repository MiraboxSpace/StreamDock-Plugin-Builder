# Installation and sharing

## Destination precedence

1. `--root <directory>`: an explicitly verified **RGB directory**, not the
   Craft data root. Useful for SyncRGB's own tree or isolated tests.
2. On Windows, read `%APPDATA%/HotSpot/configuration.ini` and the value of
   `[DeviceTypeDownNum]` / `MiraBox%20Craft` (also accepts decoded MiraBox Craft).
   This value is the Craft data root; append `SDModules/mRGB/RGB` and then
   the alphanumeric effect folder name.
3. Missing file, missing key or empty value: use the default Craft data root
   `%APPDATA%/HotSpot/MiraBox Craft`, followed by `SDModules/mRGB/RGB`.

Without --root, additionally install into
`%APPDATA%/HotSpot/SyncRGB/SDModules/mRGB/RGB` if that directory already exists.
This is a second copy, not a fallback that replaces the Craft destination.
Resolve and deduplicate paths so the same directory is not installed twice.
Do not create an unrelated SyncRGB tree if it is absent. Preflight all targets
before copying; report every actual destination and any partial failure.

Example: `MiraBox%20Craft=F:/CraftData/MiraBox Craft` resolves ColorWave to
`F:/CraftData/MiraBox Craft/SDModules/mRGB/RGB/ColorWave`.
Never append `plugins`: that is for Craft screen widgets, not lighting effects.
Do not fall back silently on unreadable files or invalid relative paths.
The helper handles UTF-8/UTF-16 BOM, quoted values and spaces. Decode only
the key; preserve literal percent signs in the path value.

## Commands

```powershell
python <skill>/scripts/effect.py validate <project>/ColorWave
python <skill>/scripts/effect.py install <project>/ColorWave
python <skill>/scripts/effect.py package <project>/ColorWave
```

Installation validates first, copies files and compares their bytes, then
reports the exact destination. It does not start/restart the host or edit
configuration. Existing destinations require an intentional `--replace`;
updates copy matching files without recursively deleting the destination.
Do not use replacement for an unrelated same-named effect.

There is **no development/production version distinction**. After installing,
tell the user to restart Craft/SyncRGB (whichever data tree was selected), then
select the effect by its localized name and verify colors, speed and mode.
Do not merely say “done” without the restart instruction.

## Shareable output

`package` creates `<effect-parent>/release/ColorWave.mRGBEffect`, or a specified
`--output <file.mRGBEffect>`. It validates first and verifies ZIP CRC and contents.
The installer is ZIP data with a `.mRGBEffect` suffix, not `.zip`. Its HTML,
SVG cover, manifest and locale files are directly at archive root: for example,
`manifest.json` and `ColorWave.html`, never `ColorWave/manifest.json`.
It contains no enclosing effect folder, existing installers, dependency tree,
build cache or absolute local paths. Do not use `.sdPlugin` or `.mPanelPlugin`.
For manual extraction, create the alphanumeric effect folder in the recipient's
resolved RGB directory and extract the files there, then restart the software.

Offer the output path/link and explain it can be shared. Space upload is at
https://space.mirabox.net/contentUpload for other users to download. Never upload on a
simple request to author/install a local effect.

## Validation limits

The helper checks the folder/file stem, manifest schema, 320 × 200 canvas,
240 × 240 cover dimensions, complete 14-locale dictionaries and JS syntax using Node.
It cannot establish device discovery or the host's live parameter injection.
Test rendering separately and get actual host feedback after restart.
