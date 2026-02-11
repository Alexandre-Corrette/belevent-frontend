<script setup lang="ts">
interface Props {
  icon?: string
  message: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: undefined,
  actionLabel: undefined,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="bel-empty-state">
    <div v-if="icon" class="bel-empty-state__icon">{{ icon }}</div>
    <p class="bel-empty-state__message">{{ message }}</p>
    <BelButton
      v-if="actionLabel"
      :label="actionLabel"
      variant="primary"
      size="sm"
      @click="emit('action')"
    />
  </div>
</template>