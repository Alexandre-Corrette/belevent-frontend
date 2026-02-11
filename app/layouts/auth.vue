<script setup lang="ts">
// Layout Auth — used by /auth/* pages
</script>

<template>
  <div class="layout-auth">
    <div class="layout-auth__logo">
      <div class="layout-auth__logo-text">
        BEL<span>◄</span>EVENT
      </div>
      <div class="layout-auth__logo-subtitle">Simpler Events</div>
    </div>

    <div class="layout-auth__card">
      <slot />
    </div>
  </div>
</template>