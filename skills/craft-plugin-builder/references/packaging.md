# Production delivery and installer packages

## Development handoff

Every development delivery must include:

> This is a development version. Please test the widget, settings and resizing
> in Craft, then confirm it works. I will build and install the production
> version and provide a shareable installer after your confirmation/request.

Use the user's language. State Node's local source dependency or Vue's running
Vite dependency. Do not imply the installed development version is portable.

## Production request

An explicit request for a formal/production build starts the complete flow;
do not request approval again or stop at compilation:

1. Node: from `plugin/`, run `npm run build` (ncc, `autofile.js` installation,
   then the npm `postbuild` packaging hook). Vue: from the project root, run
   `npm run build` (Vite, `autofile.cjs` installation, then `postbuild`).
2. Install into the active directory determined by `craft-paths.cjs`, honoring
   `CRAFT_PLUGINS_DIR` and HotSpot/configuration.ini. No configuration means
   the default directory. Verify its manifest/entry matches this build, not
   only that an older installed folder exists. Arrange a Craft close/restart
   when needed; do not kill unrelated processes.
3. Verify `<project>/release/<plugin-id>.mPanelPlugin` is a ZIP archive with
   `manifest.json` directly at the root. The helper checks manifest and PI
   entry paths and reads the archive back. Use fresh compiled output, not an
   installed directory polluted by logs or a source tree with a dev launcher.
4. Return the archive's absolute path/link and actual install path. Tell the
   user to restart/reload Craft as appropriate. Explicitly say the installer
   can be shared, and link https://space.mirabox.net/contentUpload for publishing.
   Creating the file is not permission to upload it.

## Archive layout

```text
release/com.mirabox.streamdock.example.mPanelPlugin   (ZIP bytes, no .zip suffix)
├── manifest.json
├── <language>.json
├── plugin/index.js              (Node production bundle)
├── propertyInspector/           (Node PI)
└── static/                      (Node assets)
```

Vue instead includes `index.html` and its emitted assets at the same archive
root. There must NOT be a `com.*.mPanelPlugin/` outer directory inside this ZIP.
Never append a version or `(1)` to the installer filename; use different output
directories to keep multiple versions.

The generated archive excludes hidden files, logs, release outputs, dependency
folders and backend build tooling. Native binaries/assets emitted by ncc are
included with the production backend. Validate those on the target platform.
The output lives in the source project's `release/`, outside the installed
plugin folder to avoid packaging the package again.

## Existing projects

Templates copied before this update do not automatically gain `postbuild`.
Copy `installer.cjs` and `package.cjs` from the matching Node `plugin/` or Vue
`script/` template, add `fflate: ^0.8.2` to devDependencies and install it.
Add `postbuild` and `package` npm scripts using the template's relative paths.
Preserve the existing compile AND active-directory installation steps in
`build`. `npm run package` only recreates an archive from existing production
output; it does not build or install, and is not a substitute for a requested
production release. For customized layouts, adapt `package.cjs` inputs to the
actual fresh production output and verify every runtime asset is present.
