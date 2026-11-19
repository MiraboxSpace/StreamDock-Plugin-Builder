<!-- Plugin runtime host. Auto-registers every action module under
     @/plugin/actions. Craft fires no device/application/system events, so there
     is nothing else to wire up here. Do not modify. -->
<script setup lang="ts">
  Object.entries(import.meta.glob('@/plugin/actions/*.ts', { eager: true, import: 'default' })).forEach(([path, fn]) =>
    (fn as Function)(path.replace('/src/plugin/actions/', '').replace('.ts', ''))
  );
</script>

<template></template>

<style lang="scss" scoped></style>
