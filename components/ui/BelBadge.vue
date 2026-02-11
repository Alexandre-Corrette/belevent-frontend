<script setup lang="ts">
interface Props {
  count: number
  variant?: 'danger' | 'warning' | 'success'
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'danger',
  max: 99,
})

const displayCount = computed(() => {
  if (props.count > props.max) return `${props.max}+`
  return String(props.count)
})
</script>

<template>
  <span v-if="count > 0" :class="['bel-badge', `bel-badge--${variant}`]">
    {{ displayCount }}
  </span>
</template>
