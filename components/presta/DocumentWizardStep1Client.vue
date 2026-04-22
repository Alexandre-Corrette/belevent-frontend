<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { inviteClientSchema } from '~/validation/presta'

type Mode = 'existing' | 'create'

const emit = defineEmits<{
  submit: [payload: { clientId: number }]
}>()

const clientsStore = useClientsStore()
const { show: showToast } = useToast()

const mode = ref<Mode>('existing')
const selectedClientId = ref<number | null>(null)
const existingError = ref('')
const serverError = ref('')

const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: toTypedSchema(inviteClientSchema),
})
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')

const clientOptions = computed(() =>
  clientsStore.clientsByName.map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName} — ${c.email}`,
  })),
)

async function submitExisting() {
  existingError.value = ''
  if (!selectedClientId.value) {
    existingError.value = 'Veuillez sélectionner un client'
    return
  }
  emit('submit', { clientId: selectedClientId.value })
}

const submitCreate = handleSubmit(async (values) => {
  serverError.value = ''
  const result = await clientsStore.inviteClient({
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
  })
  if (!result) {
    serverError.value = clientsStore.error ?? "Impossible d'inviter le client"
    return
  }
  if (result.status === 201) {
    showToast('Nouveau client invité.')
  } else {
    showToast('Ce client existait déjà, association créée.')
  }
  resetForm()
  emit('submit', { clientId: result.client.id })
})

function onSubmit() {
  if (mode.value === 'existing') submitExisting()
  else submitCreate()
}

onMounted(() => {
  if (clientsStore.clients.length === 0) clientsStore.fetchClients()
})
</script>

<template>
  <div class="presta-document-wizard__step">
    <h2 class="presta-document-wizard__step-title">Étape 1 — Associer un client</h2>
    <p class="presta-document-wizard__step-desc">
      Sélectionnez un client existant ou créez-en un nouveau.
    </p>

    <div class="presta-document-wizard__mode-picker" role="radiogroup">
      <label>
        <input v-model="mode" type="radio" value="existing" /> Sélectionner un client existant
      </label>
      <label>
        <input v-model="mode" type="radio" value="create" /> Créer un nouveau client
      </label>
    </div>

    <form class="presta-document-wizard__form" @submit.prevent="onSubmit">
      <template v-if="mode === 'existing'">
        <BelSelect
          v-model="selectedClientId"
          label="Client"
          :options="clientOptions"
          searchable
          placeholder="Chercher un client…"
          :error="existingError"
        />
      </template>

      <template v-else>
        <BelInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="client@exemple.com"
          :error="emailError"
          required
        />
        <BelInput
          v-model="firstName"
          label="Prénom"
          :error="firstNameError"
          required
        />
        <BelInput
          v-model="lastName"
          label="Nom"
          :error="lastNameError"
          required
        />
        <p v-if="serverError" class="presta-document-wizard__error" role="alert">
          {{ serverError }}
        </p>
      </template>

      <div class="presta-document-wizard__step-actions">
        <BelButton
          type="submit"
          label="Valider le client"
          variant="primary"
          :loading="isSubmitting || clientsStore.loading"
        />
      </div>
    </form>
  </div>
</template>
