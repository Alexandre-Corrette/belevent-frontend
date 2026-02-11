<script setup lang="ts">
interface Tab {
  key: string
  label: string
  badge?: number
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="bel-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :class="['bel-tabs__tab', { 'bel-tabs__tab--active': modelValue === tab.key }]"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <BelBadge v-if="tab.badge && tab.badge > 0" :count="tab.badge" />
    </button>
  </div>
</template>