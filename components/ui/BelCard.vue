<script setup lang="ts">
interface Props {
  title?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  padding: 'md',
})
</script>

<template>
  <div :class="['bel-card', `bel-card--padding-${padding}`]">
    <div v-if="title" class="bel-card__title">{{ title }}</div>
    <slot />
  </div>
</template>
