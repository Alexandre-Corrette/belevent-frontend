<script setup lang="ts">
interface Props {
  accept?: string
  maxSize?: number
  modelValue: File | null
  label?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.pdf,.jpg,.jpeg,.png',
  maxSize: 10,
  label: undefined,
  error: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
}>()

const isDragover = ref(false)
const internalError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const displayError = computed(() => props.error || internalError.value)

const acceptedExtensions = computed(() => {
  return props.accept
    .split(',')
    .map((e) => e.trim().toLowerCase())
})

function validateFile(file: File): boolean {
  internalError.value = null

  // Validate extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!acceptedExtensions.value.includes(ext)) {
    internalError.value = `Type de fichier non accepté. Formats autorisés : ${props.accept}`
    return false
  }

  // Validate size (maxSize in MB)
  if (file.size > props.maxSize * 1024 * 1024) {
    internalError.value = `Fichier trop volumineux. Taille max : ${props.maxSize} Mo`
    return false
  }

  return true
}

function handleFile(file: File) {
  if (validateFile(file)) {
    emit('update:modelValue', file)
  }
}

function onDrop(event: DragEvent) {
  isDragover.value = false
  const file = event.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function remove() {
  internalError.value = null
  emit('update:modelValue', null)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function openPicker() {
  fileInputRef.value?.click()
}
</script>

<template>
  <div :class="['bel-file-upload', { 'bel-file-upload--error': displayError }]">
    <span v-if="label" class="bel-file-upload__label">{{ label }}</span>

    <div
      v-if="!modelValue"
      :class="['bel-file-upload__zone', { 'bel-file-upload__zone--dragover': isDragover }]"
      @click="openPicker"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
      @drop.prevent="onDrop"
    >
      <div class="bel-file-upload__icon">&#x1F4C1;</div>
      <div class="bel-file-upload__text">
        Glisser-déposer ou <strong>Importer</strong>
      </div>
      <div class="bel-file-upload__types">{{ accept }}</div>
    </div>

    <div v-else class="bel-file-upload__file">
      <span class="bel-file-upload__file-name">{{ modelValue.name }}</span>
      <button
        type="button"
        class="bel-file-upload__file-remove"
        aria-label="Supprimer le fichier"
        @click="remove"
      >
        &times;
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      hidden
      @change="onFileChange"
    />

    <span v-if="displayError" class="bel-file-upload__error" role="alert">
      {{ displayError }}
    </span>
  </div>
</template>