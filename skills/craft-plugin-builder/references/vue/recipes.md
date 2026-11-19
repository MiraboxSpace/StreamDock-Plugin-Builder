# Canvas drawing recipes

Each recipe is one action module — the body of
`src/plugin/actions/<uuid>.ts`'s `export default function (name)`. The shared
skeleton wires the three events; the recipes vary only the `draw()` and the
refresh cadence.

## The action skeleton

```ts
import { usePluginStore, useWatchEvent } from '@/hooks/plugin';

export default function (name: string) {
  const ActionID = `${window.argv[3].plugin.uuid}.${name}`;
  const plugin = usePluginStore();

  useWatchEvent('action', {
    ActionID,
    willAppear({ context, payload }) {
      plugin.getAction(context)!.setSettings(payload.settings); // persist defaults
      start(context);
    },
    willDisappear({ context }) {
      plugin.Unterval(ActionID + context);                     // always stop the timer
    },
    didReceiveSettings({ context }) {
      plugin.Unterval(ActionID + context);
      start(context);                                          // PI edit OR resize → redraw
    }
  });

  const start = (context: string) => {
    draw(context);
    plugin.Interval(ActionID + context, 1000, () => draw(context)); // omit for static widgets
  };

  const sizeOf = (context: string) => {
    const g = (plugin.getAction(context)?.settings as any)?.ActionGeometry;
    return { W: Number(g?.width) || 680, H: Number(g?.height) || 460 };
  };

  const draw = (context: string) => { /* recipes below */ };
}
```

> **Always read the size from `ActionGeometry` inside `draw()`** (`sizeOf`
> above). On-screen resize arrives through `didReceiveSettings`, so a redraw is
> all you need to scale.

---

## 1. Static text card

```ts
const draw = (context: string) => {
  const { W, H } = sizeOf(context);
  const s = plugin.getAction(context)!.settings as any;
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  ctx.fillStyle = s.bgColor || '#10131a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = s.textColor || '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(H * 0.2)}px Arial`;
  ctx.fillText(s.text || 'Hello', W / 2, H / 2);
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};
// static → in start(), call draw(context) only (no Interval)
```

---

## 2. Live clock (timed refresh)

```ts
const draw = (context: string) => {
  const { W, H } = sizeOf(context);
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#7fe3a0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(H * 0.3)}px Arial`;
  ctx.fillText(new Date().toLocaleTimeString(), W / 2, H / 2);
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};
// start() keeps plugin.Interval(..., 1000, ...) ticking
```

---

## 3. ActionGeometry — respond to resize, and resize from code

**Respond to an on-screen resize:** nothing special — `didReceiveSettings`
fires with the new `ActionGeometry`, and `sizeOf()` picks it up on the next
`draw()`.

**Change the size from code** (the only way — `setSettings` cannot set
`ActionGeometry`): draw a canvas of the new dimensions and `setImage` it. Craft
adopts the image's size and sends you back a `didReceiveSettings`.

```ts
// Make the widget twice as tall, content-driven:
const resizeAndDraw = (context: string, newW: number, newH: number) => {
  const cvs = document.createElement('canvas'); cvs.width = newW; cvs.height = newH;
  const ctx = cvs.getContext('2d')!;
  // ...draw at newW × newH...
  plugin.getAction(context)!.setImage(cvs.toDataURL());  // Craft updates ActionGeometry to newW×newH
};
```

A common use: a list whose height depends on item count — compute `H` from the
data, draw at that height, and the widget grows/shrinks to fit.

---

## 4. Draw an image (with a cache)

```ts
const imgCache = new Map<string, HTMLImageElement | null>();
const loadImg = (url: string) => new Promise<HTMLImageElement | null>((res) => {
  if (imgCache.has(url)) return res(imgCache.get(url)!);
  const img = new Image();
  img.crossOrigin = 'anonymous';                 // needed if you toDataURL() a cross-origin image
  img.onload = () => { imgCache.set(url, img); res(img); };
  img.onerror = () => { imgCache.set(url, null); res(null); };
  img.src = url;
});

const draw = async (context: string) => {
  const { W, H } = sizeOf(context);
  const s = plugin.getAction(context)!.settings as any;
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  const img = await loadImg(s.imageUrl);
  if (img) ctx.drawImage(img, 0, 0, W, H);
  else { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, W, H); }
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};
```

> `toDataURL()` taints on cross-origin images without CORS headers; set
> `crossOrigin = 'anonymous'` and use a host that allows it, or proxy the image.

---

## 5. Progress bar / gauge

```ts
const draw = (context: string) => {
  const { W, H } = sizeOf(context);
  const pct = Math.max(0, Math.min(1, (plugin.getAction(context)!.settings as any).value ?? 0.5));
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  ctx.fillStyle = '#10131a'; ctx.fillRect(0, 0, W, H);
  const barH = H * 0.25, y = (H - barH) / 2, pad = W * 0.08;
  ctx.fillStyle = '#26304a'; ctx.fillRect(pad, y, W - pad * 2, barH);
  ctx.fillStyle = '#4a90d9'; ctx.fillRect(pad, y, (W - pad * 2) * pct, barH);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(H * 0.16)}px Arial`;
  ctx.fillText(`${Math.round(pct * 100)}%`, W / 2, y - H * 0.12);
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};
```

---

## 6. Fetch an API and draw (polling)

```ts
const fetchAndDraw = async (context: string) => {
  const { W, H } = sizeOf(context);
  const s = plugin.getAction(context)!.settings as any;
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  ctx.fillStyle = '#10131a'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  try {
    const data = await (await fetch(s.apiUrl)).json();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(H * 0.22)}px Arial`;
    ctx.fillText(String(data.value), W / 2, H / 2);
  } catch {
    ctx.fillStyle = '#c0607a'; ctx.font = `${Math.round(H * 0.12)}px Arial`;
    ctx.fillText('Network error', W / 2, H / 2);
  }
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};

const start = (context: string) => {
  const secs = Math.max(10, Number((plugin.getAction(context)!.settings as any).refreshInterval) || 60);
  fetchAndDraw(context);
  plugin.Interval(ActionID + context, secs * 1000, () => fetchAndDraw(context));
};
```

---

## 7. Resolution-independent layout (design-space scaling)

Lay everything out in a fixed base width, then scale to the real width so the
design looks identical at any `ActionGeometry`:

```ts
const BASE_W = 680;
const draw = (context: string) => {
  const { W, H } = sizeOf(context);
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d')!;
  ctx.scale(W / BASE_W, W / BASE_W);   // now draw in BASE_W-wide coordinates
  // ...all coordinates/font sizes are in design space...
  plugin.getAction(context)!.setImage(cvs.toDataURL());
};
```

---

## 8. Messaging between the PI and the runtime

```ts
// PI (pages/actions/<uuid>.vue)
const property = usePropertyStore();
property.sendToPlugin({ cmd: 'refresh' });
```

```ts
// runtime (plugin/actions/<uuid>.ts) — add to the useWatchEvent handlers
sendToPlugin({ context, payload }) {
  if (payload.cmd === 'refresh') draw(context);
}
```

The runtime can push back with
`plugin.getAction(context)!.sendToPropertyInspector({ ... })`, handled in the
PI's `useWatchEvent({ sendToPropertyInspector(data) { ... } })`.

---

## Key takeaways

- Every `draw()` starts by reading `ActionGeometry` (`sizeOf`) — never hardcode
  the size.
- The only way to change the widget size is to `setImage` a different-sized
  canvas; `setSettings` cannot touch `ActionGeometry`.
- Use `plugin.Interval` / `Unterval` (Web Worker) for refresh, keyed by
  `ActionID + context`; clear it in `willDisappear`.
- Keep transient animation/frame state in module-level maps keyed by `context`,
  not in `settings` (settings get overwritten by `didReceiveSettings`).
- For high-frequency repaints (games / animation / live gauges), don't push with
  `setImage(toDataURL())` — it base64-encodes on the main thread and janks. Use
  `setImageBlob` with `canvas.toBlob('image/webp', q)` (off-thread encode, raw
  bytes, alpha support). See "Binary image push" in `sdk-api.md`.
- `settings` holds user config only; persist it with
  `plugin.getAction(context)!.setSettings(...)`.
- It is a real Chromium canvas — gradients, shadows, `drawImage`, and custom
  fonts all work.
