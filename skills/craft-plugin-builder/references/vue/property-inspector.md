# Property Inspector (PI) development

The PI is the settings panel Craft shows when the user edits a widget. It is a
Vue page at `src/pages/actions/<uuid>.vue`, loaded by the PI host
(`src/pages/index.vue`) for whichever action the user is editing. Craft always
loads a PI page, so every action has one (it can be almost empty if there is
nothing to configure).

## How it is wired

- `src/pages/index.vue` is the host: it wraps a naive-ui dark theme and loads
  `@/pages/actions/${argv[4].action.split('.').pop()}.vue` — i.e. the `.vue`
  file whose name matches the action uuid's last segment.
- `usePropertyStore()` gives you `property.settings`, seeded from
  `argv[4].payload.settings`.
- **Assigning to `property.settings.*` auto-persists** (debounced). The plugin
  runtime then receives `didReceiveSettings` and redraws.

## Writing the form

Bind controls directly to `property.settings`. Use plain HTML inputs (or
naive-ui components — it is available) and scoped styles.

```vue
<script setup lang="ts">
import { usePropertyStore } from '@/hooks/property';
import { useI18nStore } from '@/hooks/i18n';

const i18n = useI18nStore();
const property = usePropertyStore();

onMounted(() => {
  // seed defaults so v-model has something to bind to
  if (property.settings.text === undefined) property.settings.text = 'Hello Craft';
});
</script>

<template>
  <div class="pi">
    <div class="card">
      <span class="field-label">{{ i18n.text }}</span>
      <input v-model="property.settings.text" type="text" class="input" />
    </div>
    <div class="card">
      <span class="field-label">{{ i18n.bgColor }}</span>
      <input v-model="property.settings.bgColor" type="color" />
    </div>
  </div>
</template>
```

Control → settings mapping:

| User configures | Control |
|-----------------|---------|
| Text (label, URL, city) | `<input type="text">` |
| Number (interval, threshold) | `<input v-model.number type="number">` |
| Color | `<input type="color">` |
| Toggle | `<input type="checkbox">` |
| One-of-many (mode) | `<select>` / naive-ui `NSelect` |
| Multi-line | `<textarea>` |

## Persistence rules

- **Do not** assemble `setSettings` yourself — assignment to `property.settings`
  handles it.
- **Never write `property.settings.ActionGeometry`** to resize — Craft ignores
  it. Resizing happens by drawing a different-sized canvas on the runtime side
  (see `recipes.md`).
- The runtime side gets the change through `didReceiveSettings`; that is your
  redraw trigger.

## Reacting to events in the PI

```ts
import { usePropertyStore, useWatchEvent } from '@/hooks/property';

useWatchEvent({
  didReceiveSettings() { /* settings re-synced by the framework; react if needed */ },
  sendToPropertyInspector(data) { /* data pushed from the runtime */ }
});
```

The framework already re-syncs `property.settings` on `didReceiveSettings`
(guarded so it does not loop), so you only add a handler when you need to do
something extra.

> **`didReceiveSettings` fires once on the PI's first load too** — not only after
> a backend `setSettings`. That first event delivers the widget's current stored
> settings, so it is the **reliable place to initialize derived UI state from
> settings** (e.g. seeding the position inputs, or any control whose source of
> truth lives in `settings` but is NOT a direct `v-model` to `property.settings`).
> Doing this in `onMounted` instead reads stale/empty values, because the live
> settings have not arrived yet. Direct `v-model="property.settings.foo"` bindings
> don't need this — the framework re-sync updates them; it's the *indirect* values
> (copied into another store/ref) that must be (re)seeded here.

## Uploading files

When the user selects an asset that should travel with an exported Craft scene
(for example an image, audio file, JSON file, or other local resource), use the
Qt file selector from the PI:

```ts
qtWebChannel.qtObject.openFileSelectorNew(context, 1, 'jpg,png');
```

Do not use a plain browser `<input type="file">` for scene assets. Files selected
through `openFileSelectorNew` are copied into the scene folder, so exporting the
scene can include them.

Parameter meaning:

| Parameter | Meaning |
|-----------|---------|
| `UUID` | Unique selector key. Use the widget PI `context`, or another unique value if one PI has multiple file pickers. |
| `count` | Maximum number of files the user can select. Use `1` for a single file. |
| `fileType` | Allowed file extensions, separated by commas, for example `'jpg,png'`. |

Receive the selected file list through `qmlMessage`. Store only the returned
file name/path segment in `property.settings`, not an absolute path, and delete
the old stored file when replacing it:

```ts
qtWebChannel.qtObject.qmlMessage.connect(function (key: string, filePath: string) {
  if (key == context) {
    filePath = JSON.parse(filePath)[0];
    const path = filePath.split(/[\\/]/)[filePath.split(/[\\/]/).length - 1];
    qtWebChannel.qtObject.deleteFile(property.settings.path);
    property.settings.path = path;
    label.value = property.settings.path;
  }
});
```

Use a unique `context` per upload request if one PI has multiple file pickers,
so callbacks cannot update the wrong setting.

## Widget position (Coordinates card) — optional

`useQtWebChannelStore()` exposes the widget's X/Y position on the secondary
screen and an arrow-key (↑↓←→) nudge handler. The bundled PI includes a
Coordinates card showing the pattern:

```vue
<input v-model="qt.x" type="number"
       @input="qt.qtObject.uDidReceiveCoordinate(qt.x, qt.y)" />
```

Register `qt.handleKeydown` on `window`'s `keydown` (and remove it on unmount) to
enable the arrow-key nudge.

> **Sync the X/Y from settings in `didReceiveSettings`, not `onMounted`.** Craft
> stores the widget position in `settings` (like `ActionGeometry`), and the
> `qtWebChannel` store starts at `0,0`. If you seed `qt.x/qt.y` in `onMounted`
> the live settings have not arrived yet, so the inputs show `0` every time the
> panel reopens. Seed them in the `didReceiveSettings` handler instead — it fires
> on first load and carries the stored position. You do **not** need to persist
> X/Y back to settings yourself; Craft manages it.
>
> ```ts
> useWatchEvent({
>   didReceiveSettings(data) {
>     const s = data?.payload?.settings; if (!s) return;
>     qt.x = Math.round(Number(s.x) || 0);
>     qt.y = Math.round(Number(s.y) || 0);
>   }
> });
> ```

Remove the import and the card if the plugin does not need positioning. It only
functions inside Craft's webview (it relies on the `qt` global).

## Localization

PI label text lives in `src/hooks/i18n.ts`, keyed by
`argv[3].application.language` with an English fallback:

```ts
const base = { text: 'Text', bgColor: 'Background' };
export const useI18nStore = () => {
  const language = window.argv[3].application.language;
  const L = { en: { ...base }, zh_CN: { text: '文字', bgColor: '背景颜色' } };
  return L[language] ?? L['en'];
};
```

Plugin/action **names** (in Craft's action list) are separate — they come from
`manifest.cjs` `i18n` and are written into `dist/<lang>.json` by `autofile.cjs`.

## Debugging the PI

The PI runs in Craft's embedded Chromium. In dev mode it is the same Vite app at
`http://localhost:5173` — open it in a desktop browser to inspect with DevTools
(note: `qtWebChannel` features only work inside Craft). After editing PI code in
dev, just reopen the widget's settings panel. See `build-and-debug.md`.
