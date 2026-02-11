<script setup lang="ts">
interface Props {
  label: string
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  icon: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(event: MouseEvent) {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'bel-button',
      `bel-button--${variant}`,
      `bel-button--${size}`,
      { 'bel-button--loading': loading },
    ]"
    @click="handleClick"
  >
    <span v-if="loading" class="bel-button__spinner" aria-hidden="true" />
    <span v-else-if="icon" class="bel-button__icon">{{ icon }}</span>
    <span v-if="!loading">{{ label }}</span>
    <span v-else class="sr-only">Chargement...</span>
  </button>
</template>
