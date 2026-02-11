<script setup lang="ts">
interface Props {
  label: string
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: undefined,
  error: undefined,
  required: false,
  disabled: false,
  maxlength: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputId = useId()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    :class="[
      'bel-input',
      { 'bel-input--error': error, 'bel-input--disabled': disabled },
    ]"
  >
    <label
      :for="inputId"
      :class="['bel-input__label', { 'bel-input__label--required': required }]"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      class="bel-input__field"
      @input="onInput"
    />
    <span v-if="error" :id="`${inputId}-error`" class="bel-input__error" role="alert">
      {{ error }}
    </span>
  </div>
</template>