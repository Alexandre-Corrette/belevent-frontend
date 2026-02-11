<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const containerRef = ref<HTMLElement | null>(null)

function close() {
  if (props.closable) {
    emit('update:modelValue', false)
  }
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

// Lock body scroll when modal is open
watch(
  () => props.modelValue,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="bel-modal">
      <div
        v-if="modelValue"
        class="bel-modal__overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click="handleOverlayClick"
        @keydown="handleKeydown"
      >
        <div ref="containerRef" :class="['bel-modal__container', `bel-modal__container--${size}`]">
          <div class="bel-modal__header">
            <h2 class="bel-modal__title">{{ title }}</h2>
            <button v-if="closable" class="bel-modal__close" aria-label="Fermer" @click="close">
              &times;
            </button>
          </div>

          <div class="bel-modal__body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="bel-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>