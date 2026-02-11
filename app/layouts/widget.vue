<script setup lang="ts">
// Layout Widget — minimal container for the Leïa chat widget
// No auth middleware, no header/footer — runs in an iframe
</script>

<template>
  <div class="layout-widget">
    <slot />
  </div>
</template>