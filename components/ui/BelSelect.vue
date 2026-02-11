<script setup lang="ts">
interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  label: string
  modelValue: string | number | null
  options: SelectOption[]
  searchable?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchable: false,
  placeholder: undefined,
  error: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(-1)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const selectedLabel = computed(() => {
  const option = props.options.find((o) => o.value === props.modelValue)
  return option?.label ?? null
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    focusedIndex.value = -1
    searchQuery.value = ''
    nextTick(() => searchRef.value?.focus())
  }
}

function select(option: SelectOption) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (focusedIndex.value >= 0 && filteredOptions.value[focusedIndex.value]) {
        select(filteredOptions.value[focusedIndex.value])
      }
      break
    case 'Escape':
      isOpen.value = false
      triggerRef.value?.focus()
      break
  }
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div
    :class="[
      'bel-select',
      { 'bel-select--error': error, 'bel-select--disabled': disabled },
    ]"
    @keydown="handleKeydown"
  >
    <span class="bel-select__label">{{ label }}</span>

    <div
      ref="triggerRef"
      role="combobox"
      tabindex="0"
      :aria-expanded="isOpen"
      :class="[
        'bel-select__trigger',
        { 'bel-select__trigger--placeholder': !selectedLabel },
      ]"
      @click="toggle"
    >
      <span>{{ selectedLabel || placeholder || 'Sélectionner...' }}</span>
      <span :class="['bel-select__chevron', { 'bel-select__chevron--open': isOpen }]">▼</span>
    </div>

    <div v-if="isOpen" ref="dropdownRef" class="bel-select__dropdown">
      <div v-if="searchable" class="bel-select__search">
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          @click.stop
        />
      </div>

      <template v-if="filteredOptions.length">
        <div
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          :class="[
            'bel-select__option',
            {
              'bel-select__option--selected': option.value === modelValue,
              'bel-select__option--focused': index === focusedIndex,
            },
          ]"
          @click="select(option)"
        >
          {{ option.label }}
        </div>
      </template>
      <div v-else class="bel-select__empty">Aucun résultat</div>
    </div>

    <span v-if="error" class="bel-select__error" role="alert">{{ error }}</span>
  </div>
</template>
