<script setup lang="ts">
interface Props {
  value: number
  max?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  label: undefined,
  size: 'md',
  color: undefined,
})

const SIZES = { sm: 60, md: 90, lg: 130 }

const svgSize = computed(() => SIZES[props.size])
const radius = computed(() => (svgSize.value - 12) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const percentage = computed(() => Math.min(Math.max(props.value / props.max, 0), 1) * 100)
const strokeDashoffset = computed(() => {
  return circumference.value - (percentage.value / 100) * circumference.value
})
</script>

<template>
  <div :class="['bel-progress', `bel-progress--${size}`]">
    <div class="bel-progress__circle">
      <svg
        class="bel-progress__svg"
        :width="svgSize"
        :height="svgSize"
        :viewBox="`0 0 ${svgSize} ${svgSize}`"
      >
        <circle
          class="bel-progress__track"
          :cx="svgSize / 2"
          :cy="svgSize / 2"
          :r="radius"
        />
        <circle
          class="bel-progress__fill"
          :cx="svgSize / 2"
          :cy="svgSize / 2"
          :r="radius"
          :stroke="color || 'var(--bel-primary, #5a8a7a)'"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
        />
      </svg>
      <span class="bel-progress__value">{{ Math.round(percentage) }}%</span>
    </div>
    <span v-if="label" class="bel-progress__label">{{ label }}</span>
  </div>
</template>