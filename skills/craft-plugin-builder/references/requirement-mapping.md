# Requirement mapping

| Requirement | Implementation |
| --- | --- |
| Static text/card | SVG in plugin/index.js; PI text/color settings |
| Clock/status | setInterval per context; clearInterval on disappearance |
| Remote data | Node fetch; timeouts, stale-result guard, error display |
| PNG/photo/chart | Node raster library; verify native dependencies |
| Animation | binary setImageBlob, bounded cadence and backpressure |
| Size | current settings.ActionGeometry; new image to request resizing |
| Position | optional Qt PI coordinate bridge |
| Scene assets | Qt openFileSelectorNew, store scene-relative filename |
| Shared configuration | getGlobalSettings/setGlobalSettings |
| Warning threshold | lightControl on transitions; shared alarm ownership |
| Localization | root language files + PI labels keyed by host language |
| Button/dial/touch control | not Craft; use Dock skill instead |

Choose refresh rates according to data needs. Avoid high-frequency polling
for slow APIs. Node timers do not need Vue's worker timer implementation.
