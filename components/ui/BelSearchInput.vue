<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  debounce?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Rechercher...',
  debounce: 300,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
}>()

const { debounce: debounceMs } = toRefs(props)
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query)
}, debounceMs)

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  debouncedSearch(value)
}

function clear() {
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="bel-search-input">
    <span v-if="!loading" class="bel-search-input__icon" aria-hidden="true">&#x1F50D;</span>
    <span v-else class="bel-search-input__spinner" aria-hidden="true" />

    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      class="bel-search-input__field"
      @input="onInput"
    />

    <button
      v-if="modelValue"
      class="bel-search-input__clear"
      aria-label="Effacer la recherche"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>