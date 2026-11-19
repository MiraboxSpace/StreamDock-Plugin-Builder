<script setup lang="ts">
import { usePropertyStore, useWatchEvent } from '@/hooks/property';
import { useQtWebChannelStore } from '@/hooks/qtWebChannel';
import { useI18nStore } from '@/hooks/i18n';

// The Property Inspector is just a form. Writing to `property.settings.*`
// auto-persists (debounced) and the plugin side receives `didReceiveSettings`.
const i18n = useI18nStore();
const property = usePropertyStore();

// Optional: on-screen position of the widget. qtWebChannel talks to Craft over
// QWebChannel. Delete this block + the Coordinates card if you don't need it.
const qtWebChannel = useQtWebChannelStore();

// Sync X/Y from settings HERE, not in onMounted: Craft stores the position in
// settings and this fires on the PI's first load (and any later setSettings),
// when the live settings are actually present. Seeding in onMounted shows 0.
useWatchEvent({
  didReceiveSettings(data: any) {
    const s = data?.payload?.settings;
    if (!s) return;
    qtWebChannel.x = Math.round(Number(s.x) || 0);
    qtWebChannel.y = Math.round(Number(s.y) || 0);
  }
});

onMounted(() => {
  // Seed defaults so v-model has something to bind to.
  if (property.settings.text === undefined) property.settings.text = 'Hello Craft';
  if (property.settings.bgColor === undefined) property.settings.bgColor = '#10131a';
  if (property.settings.textColor === undefined) property.settings.textColor = '#ffffff';
  window.addEventListener('keydown', qtWebChannel.handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', qtWebChannel.handleKeydown);
});
</script>

<template>
  <div class="pi">
    <div class="card">
      <div class="field">
        <span class="field-label">{{ i18n.text }}</span>
        <input v-model="property.settings.text" type="text" class="input" />
      </div>
    </div>

    <div class="card">
      <div class="field">
        <span class="field-label">{{ i18n.bgColor }}</span>
        <input v-model="property.settings.bgColor" type="color" class="color" />
      </div>
      <div class="field">
        <span class="field-label">{{ i18n.textColor }}</span>
        <input v-model="property.settings.textColor" type="color" class="color" />
      </div>
    </div>

    <!-- Optional: position the widget on the secondary screen -->
    <div class="card">
      <div class="card-label">{{ i18n.coordinates }}</div>
      <div class="coord-row">
        <div class="coord-pair">
          <span class="axis">X</span>
          <input
            v-model="qtWebChannel.x"
            @input="qtWebChannel.qtObject.uDidReceiveCoordinate(qtWebChannel.x, qtWebChannel.y)"
            type="number" class="input"
          />
        </div>
        <div class="coord-pair">
          <span class="axis">Y</span>
          <input
            v-model="qtWebChannel.y"
            @input="qtWebChannel.qtObject.uDidReceiveCoordinate(qtWebChannel.x, qtWebChannel.y)"
            type="number" class="input"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pi {
  padding: 7px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-sizing: border-box;
  width: 100%;
}
.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-sizing: border-box;
  width: 100%;
}
.card-label {
  font-size: 8px;
  font-weight: 700;
  color: #4a6a80;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.field { display: flex; align-items: center; gap: 6px; }
.field-label { font-size: 9px; color: #6a8a9a; min-width: 56px; white-space: nowrap; }
.input {
  flex: 1;
  min-width: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #c0d0e0;
  font-size: 11px;
  padding: 3px 6px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: #4a90d9; }
}
.color {
  width: 36px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}
.coord-row { display: flex; gap: 6px; }
.coord-pair { display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; }
.axis { font-size: 9px; font-weight: 700; color: #4a6a80; flex-shrink: 0; }
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; }
</style>
