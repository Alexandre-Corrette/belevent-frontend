<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { inviteClientSchema } from '~/validation/presta'
import type { PrestaClient } from '~/types'

interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: [result: { status: number; client: PrestaClient }]
}>()

const clientsStore = useClientsStore()

const serverError = ref('')

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(inviteClientSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  const result = await clientsStore.inviteClient({
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
  })
  if (!result) {
    serverError.value = clientsStore.error ?? "Impossible d'envoyer l'invitation"
    return
  }
  emit('invited', result)
  close()
})

function close() {
  resetForm()
  serverError.value = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <BelModal :model-value="modelValue" title="Inviter un client" @update:model-value="close">
    <form class="client-invite-modal__form" @submit.prevent="onSubmit">
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
        placeholder="Prénom du client"
        :error="firstNameError"
        required
      />

      <BelInput
        v-model="lastName"
        label="Nom"
        placeholder="Nom du client"
        :error="lastNameError"
        required
      />

      <p v-if="serverError" class="client-invite-modal__error" role="alert">
        {{ serverError }}
      </p>
    </form>

    <template #footer>
      <BelButton label="Annuler" variant="ghost" @click="close" />
      <BelButton label="Envoyer l'invitation" :loading="isSubmitting" @click="onSubmit" />
    </template>
  </BelModal>
</template>
