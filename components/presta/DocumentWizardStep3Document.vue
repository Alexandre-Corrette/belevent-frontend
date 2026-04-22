<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { createDocumentSchema } from '~/validation/presta'

interface Props {
  clientId: number
  eventId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [payload: { documentId: number }]
}>()

const documentsStore = useDocumentsStore()
const { show: showToast } = useToast()

const TYPE_OPTIONS = [
  { value: 'devis', label: 'Devis' },
  { value: 'facture', label: 'Facture' },
]

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(createDocumentSchema),
  initialValues: {
    clientId: props.clientId,
    eventId: props.eventId,
  },
})

const { value: type, errorMessage: typeError } = useField<'devis' | 'facture'>('type')
const { value: designation, errorMessage: designationError } = useField<string>('designation')
const { value: amount, errorMessage: amountError } = useField<number>('amount')
const { value: category, errorMessage: categoryError } = useField<string>('category')

const file = ref<File | null>(null)
const serverError = ref('')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  const created = await documentsStore.createDocument({
    type: values.type,
    designation: values.designation,
    amount: values.amount,
    category: values.category,
    clientId: props.clientId,
    eventId: props.eventId,
  })
  if (!created) {
    serverError.value = documentsStore.error ?? 'Impossible de créer le document'
    return
  }

  if (file.value) {
    try {
      await documentsStore.uploadDocumentFile(created.id, file.value)
    } catch {
      showToast(
        documentsStore.error ?? 'Document créé mais upload en échec. Vous pourrez le ré-uploader plus tard.',
        'error',
      )
    }
  }

  emit('submit', { documentId: created.id })
})
</script>

<template>
  <div class="presta-document-wizard__step">
    <h2 class="presta-document-wizard__step-title">Étape 3 — Détails du document</h2>
    <p class="presta-document-wizard__step-desc">
      Renseignez le type, la prestation et le montant, puis joignez un fichier si besoin.
    </p>

    <form class="presta-document-wizard__form" @submit.prevent="onSubmit">
      <BelSelect
        v-model="type"
        label="Type"
        :options="TYPE_OPTIONS"
        :error="typeError"
        placeholder="Devis ou Facture"
      />

      <BelInput
        v-model="designation"
        label="Prestation"
        placeholder="Ex. Cocktail 80 personnes"
        :error="designationError"
        required
      />

      <BelInput
        v-model.number="amount"
        label="Montant (€)"
        type="number"
        :error="amountError"
        required
      />

      <BelInput
        v-model="category"
        label="Catégorie (optionnel)"
        placeholder="Ex. Photographie, Traiteur…"
        :error="categoryError"
      />

      <BelFileUpload
        v-model="file"
        label="Fichier (PDF/JPG/PNG, max 10 Mo)"
        accept=".pdf,.jpg,.jpeg,.png"
        :max-size="10"
      />

      <p v-if="serverError" class="presta-document-wizard__error" role="alert">
        {{ serverError }}
      </p>

      <div class="presta-document-wizard__step-actions">
        <BelButton
          type="submit"
          label="Créer le document"
          variant="primary"
          :loading="isSubmitting || documentsStore.loading"
        />
      </div>
    </form>
  </div>
</template>
