# Production installer packages

After a confirmed production/release request, perform all three steps:
**build → install → generate a shareable installer**. Running ncc alone is not
a delivered release. Keep the existing `autofile.js` installation/handoff;
only successful installation should proceed to packaging. Keepalive timeouts
are failures, not successful releases.

From `plugin/`, `npm run build` bundles the backend and keepalive, installs the
plugin, then npm automatically runs `postbuild: node package.cjs`. This writes
`<plugin-folder>/release/<plugin-folder-name>.sdPlugin`. Packaging reads the
source's runtime assets plus the fresh `plugin/build/` bundle, not installed
logs or a development launcher. Additional ncc-emitted assets are preserved.

## Required structure

```text
release/com.example.streamdock.demo.sdPlugin       (ZIP bytes, no .zip suffix)
└── com.example.streamdock.demo.sdPlugin/
    ├── manifest.json
    ├── <language>.json
    ├── plugin/index.js                          (production bundle)
    ├── propertyInspector/
    └── static/
```

Unlike Craft, Dock requires exactly one same-named wrapper folder in the ZIP.
The external filename and that folder must match exactly. Do not append `.zip`,
version labels, or `(1)`; use versioned parent directories if necessary.
The helper verifies the manifest/PI entries and reads the ZIP back before
reporting success. It excludes logs, dependencies, hidden files, build tooling
and previous release outputs. Never archive the full development source.

## Delivery

- Verify the installed entry/manifest belongs to the current production build.
- Verify the installer opens as ZIP, has the wrapper shown above, contains the
  production backend and all PI/resource assets, and has no local-source dev
  launcher, logs, `.dev-restarts`, or keepalive task files.
- Return an absolute link/path to the installer, the local install directory,
  and any required host restart instruction.
- Say: “You can share this plugin installer with other users. To publish it
  for download, upload it to https://space.mirabox.net/contentUpload.”
  Do not upload unless explicitly requested.

## Existing projects

Copy `installer.cjs` / `package.cjs` to the existing project's `plugin/`, add
`fflate: ^0.8.2` to devDependencies, install it, and add
`postbuild: node package.cjs` plus `package: node package.cjs`. Preserve the
existing build/install command. Exclude `release/` and these build helpers
from dev/install asset copying. Customized runtime directories require matching
adjustments to `package.cjs` and archive validation.

`npm run package` only recreates an archive from already compiled production
files. It neither compiles nor installs, so it cannot replace `npm run build`
when delivering a production release. Do not distribute a stale build.
