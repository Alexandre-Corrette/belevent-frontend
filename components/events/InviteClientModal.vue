<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { inviteClientSchema } from '~/validation/event'

interface Props {
  modelValue: boolean
  eventId: number
  hasClient?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasClient: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: [email: string]
}>()

const { apiFetch } = useApi()

const serverError = ref('')
const successMessage = ref('')

const {
  handleSubmit,
  isSubmitting,
  resetForm,
} = useForm({
  validationSchema: toTypedSchema(inviteClientSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  try {
    await apiFetch(`/events/${props.eventId}/invite`, {
      method: 'POST',
      body: {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
      },
    })
    successMessage.value = `Invitation envoyée à ${values.email}`
    emit('invited', values.email)
    setTimeout(() => {
      close()
    }, 1500)
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
    if (status === 422) {
      serverError.value = 'Veuillez vérifier les informations saisies'
    } else {
      serverError.value = "Impossible d'envoyer l'invitation"
    }
  }
})

function close() {
  resetForm()
  serverError.value = ''
  successMessage.value = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <BelModal :model-value="modelValue" title="Inviter un client" @update:model-value="close">
    <template v-if="successMessage">
      <p class="invite-client-modal__success" role="status">
        {{ successMessage }}
      </p>
    </template>

    <template v-else>
      <form class="invite-client-modal__form" @submit.prevent="onSubmit">
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

        <p v-if="serverError" class="invite-client-modal__error" role="alert">
          {{ serverError }}
        </p>
      </form>
    </template>

    <template v-if="!successMessage" #footer>
      <BelButton label="Annuler" variant="ghost" @click="close" />
      <BelButton
        label="Envoyer l'invitation"
        :loading="isSubmitting"
        @click="onSubmit"
      />
    </template>
  </BelModal>
</template>
