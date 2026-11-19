# Delivery checklist

- [ ] Dev and build retain `craft-paths.cjs`, honor `CRAFT_PLUGINS_DIR`, and read the active Craft data directory from HotSpot/configuration.ini before falling back to the default

- [ ] Default scaffold is assets/plugin-template (Node), unless Vue is requested; do not use ZIP archives.
- [ ] Root manifest has CodePath plugin/index.js and Nodejs.Version "20".
- [ ] Windows Craft >= 5.1.018.1021; no unverified macOS support claim.
- [ ] .mPanelPlugin folder, consistent UUID prefix, action suffix and PI paths.
- [ ] SecondaryScreen controller; default ActionGeometry on every action.
- [ ] No Dock key/dial/touch/title/state/OK/alert handlers.
- [ ] Lifecycle hooks use underscores; sendToPlugin does not.
- [ ] Initial settings render, PI updates render, resizing uses latest geometry.
- [ ] Multiple widgets keep independent settings/timers/async requests.
- [ ] PI setSettings/sendToPlugin use the PI registration UUID; backend writes use the widget context. Test with different IDs.
- [ ] PI exposes connectSDSocket/connectSocket/connectElgatoStreamDeckSocket aliases and connects in the actual Craft host.
- [ ] PI first-load settings and later didReceiveSettings both initialize controls.
- [ ] Scene assets use Qt selector; coordinates seed from live settings.
- [ ] Global settings messages omit context; light effect ownership is coordinated.
- [ ] SVG is escaped/encoded; binary image MIME matches actual bytes.
- [ ] Native renderer dependencies validated for the actual target runtime.
- [ ] Dev install followed by Craft restart and explicit user testing request.
- [ ] Release requested/confirmed before npm run build and production installation.
- [ ] Bundle contains dependencies and assets; dev absolute source paths excluded.
