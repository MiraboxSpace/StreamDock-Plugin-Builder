# Common-scenario code snippets

Each snippet below is the body of one `plugin.<x> = new Actions({...})` in
`plugin/index.js`. `<x>` is the last segment of the action UUID. A PI snippet
is given where one is needed.

Common header:

```js
const { Plugins, Actions, log } = require('./utils/plugin');
const plugin = new Plugins();
```

---

## SVG rendering limits (read before drawing SVG with setImage)

StreamDock's SVG rendering module **only implements the SVG Tiny 1.2 subset**;
it does not support many advanced features that desktop browsers render. A
broken SVG usually shows up as a **blank key**. Follow these rules:

**Allowed:**
- Basic shapes: `rect` `circle` `ellipse` `line` `polyline` `polygon` `path`
- Text: `text` `tspan` (use generic font names; do complex layout by setting
  `x`/`y` coordinates manually)
- Grouping and transforms: `g`, `transform` (`translate`/`scale`/`rotate`)
- Solid `fill`/`stroke`, `opacity`/`fill-opacity`/`stroke-*`
- `linearGradient` / `radialGradient` gradients, embedded `<image>`

**Do not use (won't render or behaves unreliably):**
- `<style>` tags, CSS selectors, `class` — write all styling as **element
  attributes**
- `<filter>` filters (Gaussian blur, `drop-shadow` shadows, etc.), the `filter`
  attribute
- `<mask>`, `<clipPath>`, `mix-blend-mode`
- `<foreignObject>`, HTML content, `<script>`, CSS/SMIL animation
- `paint-order` and other SVG 2 features, web fonts, external resource
  references

**Encoding**: always URL-encode the SVG with `encodeURIComponent(svg)` before
putting it in the data URI. StreamDock runs one URL-decode on the value it
receives, so a raw `#`, `%`, `<`, or space would otherwise be mis-decoded and
the key renders blank. With proper encoding, `#` hex colors, `rgb(...)`, and
color names all render correctly.

When you need complex visual effects, generate a PNG on the Node side with a
library (convert it to a base64 dataURL for `setImage`) instead of relying on
SVG filters.

---

## 1. Open a web page on press

The PI lets the user enter a URL, stored in `settings.url`.

```js
plugin.open = new Actions({
    default: { url: 'https://example.com' },
    keyUp({ context }) {
        plugin.openUrl(this.data[context].url);
    }
});
```

PI `index.js`:

```js
const $local = false, $back = false, $dom = { main: $('.sdpi-wrapper'), url: $('#url') };
const $propEvent = {
    didReceiveSettings({ settings }) { $dom.url.value = settings.url ?? ''; },
    didReceiveGlobalSettings() {}, sendToPropertyInspector() {}
};
$dom.url.on('change', () => { $settings.url = $dom.url.value; });
```

---

## 2. Run a command / program on press

```js
const { exec } = require('child_process');

plugin.run = new Actions({
    default: { cmd: '' },
    keyUp({ context }) {
        exec(this.data[context].cmd, (err) => {
            if (err) { log.error('exec failed', err); plugin.showAlert(context); }
            else plugin.showOk(context);
        });
    }
});
```

---

## 3. Multi-state switch (on/off toggle)

Configure 2 `States` for this action in the `manifest` (`States[0]` = off,
`States[1]` = on).

```js
plugin.toggle = new Actions({
    default: { on: false },
    _willAppear({ context }) {
        plugin.setState(context, this.data[context].on ? 1 : 0);
    },
    keyUp({ context }) {
        const s = this.data[context];
        s.on = !s.on;
        plugin.setSettings(context, s);
        plugin.setState(context, s.on ? 1 : 0);
        // perform the actual on/off action here
    }
});
```

---

## 4. Live clock (timed refresh + SVG)

```js
const timers = {};
// URL-encode the SVG: StreamDock runs one URL-decode on the data URI value.
const clockSvg = (t) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">` +
        `<rect width="144" height="144" fill="black"/>` +
        `<text x="72" y="85" font-size="30" fill="rgb(0,255,0)" text-anchor="middle">${t}</text></svg>`;
    return `data:image/svg+xml;charset=utf8,` + encodeURIComponent(svg);
};

plugin.clock = new Actions({
    _willAppear({ context }) {
        const tick = () => plugin.setImage(context,
            clockSvg(new Date().toLocaleTimeString()));
        tick();
        timers[context] = setInterval(tick, 1000);
    },
    _willDisappear({ context }) {           // must clear the timer
        clearInterval(timers[context]);
        delete timers[context];
    }
});
```

---

## 5. Volume dial

`Controllers: ["Knob"]` for this action in the `manifest`.

```js
plugin.volume = new Actions({
    default: { value: 50 },
    _willAppear({ context }) {
        plugin.setTitle(context, this.data[context].value + '%');
    },
    dialRotate({ context, payload }) {
        const s = this.data[context];
        s.value = Math.max(0, Math.min(100, s.value + payload.ticks)); // sign of ticks = direction
        plugin.setSettings(context, s);
        plugin.setTitle(context, s.value + '%');
        // apply s.value to the actual volume here
    },
    dialDown({ context }) {                 // press the dial: mute, etc.
        plugin.setTitle(context, 'Mute');
    }
});
```

---

## 6. Periodically fetch HTTP data and display it

```js
const timers = {};
plugin.weather = new Actions({
    default: { city: 'Beijing' },
    _willAppear({ context }) {
        const refresh = async () => {
            try {
                const res = await fetch('https://api.example.com/...');
                const data = await res.json();
                plugin.setTitle(context, String(data.temp) + '°');
            } catch (e) { log.error(e); plugin.showAlert(context); }
        };
        refresh();
        timers[context] = setInterval(refresh, 60000);
    },
    _willDisappear({ context }) {
        clearInterval(timers[context]); delete timers[context];
    }
});
```

`fetch` is built into Node 20 — no dependency needed.

---

## 7. Messaging between the backend and the PI

The PI clicks a button to notify the backend:

```js
// PI index.js
$dom.btn.on('click', () => $websocket.sendToPlugin({ cmd: 'refresh' }));
```

```js
// backend
plugin.x = new Actions({
    sendToPlugin({ context, payload }) {
        if (payload.cmd === 'refresh') { /* ... */ }
    }
});
```

The backend pushes data to the PI:

```js
plugin.sendToPropertyInspector({ status: 'ok' });   // sent to the currently open PI
```

```js
// $propEvent in the PI index.js
sendToPropertyInspector(payload) { console.log(payload.status); }
```

---

## 8. Press to start / press again to stop + live refresh (timer style)

The most common composite pattern: a key both toggles "running/stopped" and
refreshes its display live while running. **Keep runtime state (remaining
seconds, timer handles) in module-level maps, not in settings** — otherwise it
is overwritten when `didReceiveSettings` arrives.

```js
const timers = {};                        // context -> setInterval handle
const remain = {};                        // context -> remaining seconds

const mmss = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">` +
        `<rect width="144" height="144" fill="rgb(20,20,30)"/>` +
        `<text x="72" y="88" font-size="40" fill="white" text-anchor="middle">${m}:${ss}</text></svg>`;
    return `data:image/svg+xml;charset=utf8,` + encodeURIComponent(svg);   // URL-encode: app decodes once
};

plugin.timer = new Actions({
    default: { minutes: 25 },             // only user config goes into settings
    _willAppear({ context }) {
        remain[context] = this.data[context].minutes * 60;
        plugin.setImage(context, mmss(remain[context]));
    },
    keyUp({ context }) {
        if (timers[context]) {            // running → stop and reset
            clearInterval(timers[context]);
            delete timers[context];
            remain[context] = this.data[context].minutes * 60;
            plugin.setImage(context, mmss(remain[context]));
        } else {                          // stopped → start the countdown
            timers[context] = setInterval(() => {
                remain[context]--;
                plugin.setImage(context, mmss(Math.max(0, remain[context])));
                if (remain[context] <= 0) {       // countdown finished
                    clearInterval(timers[context]);
                    delete timers[context];
                    plugin.showOk(context);       // could swap the image / notify instead
                }
            }, 1000);
        }
    },
    _didReceiveSettings({ context }) {    // PI changed the minutes: refresh display while not running
        if (!timers[context]) {
            remain[context] = this.data[context].minutes * 60;
            plugin.setImage(context, mmss(remain[context]));
        }
    },
    _willDisappear({ context }) {         // must clean up, per context
        clearInterval(timers[context]);
        delete timers[context];
        delete remain[context];
    }
});
```

---

## Key takeaways

- Each `Actions` property name = the last segment of the UUID.
- The first argument is always `context` when operating on a specific key.
- Every `setInterval` must be `clearInterval`'d in `_willDisappear`; store
  timers keyed by `context`.
- Prefer SVG dataURLs for dynamic visuals; **URL-encode the SVG with
  `encodeURIComponent`** before putting it in the data URI (the app decodes it
  once).
- `settings` holds user config only; keep runtime state (timing, remaining
  values) in module-level variables, not in `settings`.
- Changed settings only persist if you call `setSettings`.
