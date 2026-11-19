# Node recipes

The bundled text-card renderer demonstrates SVG XML escaping, URL encoding,
settings defaults and geometry-driven layout.

## Per-instance clock

Add a Map named timers to the action. In _willAppear clear any previous timer
for context, render once, then store setInterval(() => this.render(context),1000).
In _willDisappear clearInterval(timers.get(context)) and delete the entry.
The render function reads this.data[context] every time, so resizing and PI
changes take effect. Never share a single timer or settings object across widgets.

## Fetch and draw

Use Node fetch with AbortSignal.timeout or an AbortController.
Capture a per-context request generation; after awaiting, verify the widget
still exists and the generation is current before saving or drawing.
Cancel outstanding requests on disappearance/settings changes. Handle failures
with a visible fallback and log.error; do not leave unhandled rejections.

## Raster images

Use a Node-compatible renderer to produce PNG/WebP bytes. Send
plugin.setImageBlob(context, bytes, 'image/png') or an appropriate dataURL.
A Node process cannot call document.createElement('canvas') or canvas.toBlob
unless supplied by a compatible rendering package. Test native-module packages
on the target host before shipping.

## Geometry

Read width/height from this.data[context].ActionGeometry. On-screen resize
arrives via _didReceiveSettings. To request a size change, render at the new
size and send that image; never persist an alternative ActionGeometry.

## Alarm

Maintain a Set of alarming contexts. On threshold transitions update the Set
and emit lightControl only when the aggregate active state changes.
On disappearance remove that context and recompute. This prevents one widget
clearing another widget's warning. See events.md for supported effect fields.
