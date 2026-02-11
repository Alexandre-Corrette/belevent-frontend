<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { companyStep2Schema } from '~/validation/company'

const emit = defineEmits<{
  submit: [data: { siret: string; companyName: string; address: string }]
}>()

const { result: siretResult, loading: siretLoading, error: siretError, searchSiret } = useSiret()
const manualMode = ref(false)
const serverError = ref('')

const { handleSubmit, isSubmitting, setFieldValue } = useForm({
  validationSchema: toTypedSchema(companyStep2Schema),
})

const { value: siret, errorMessage: siretFieldError } = useField<string>('siret')
const { value: companyName, errorMessage: companyNameError } = useField<string>('companyName')
const { value: address, errorMessage: addressError } = useField<string>('address')

defineExpose({ serverError })

// Watcher : auto-complétion quand SIRET atteint 14 chiffres
watch(siret, (val) => {
  if (val && val.replace(/\s/g, '').length === 14) {
    searchSiret(val)
  }
})

// Remplir les champs à partir de la réponse SIRENE
watch(siretResult, (result) => {
  if (result) {
    setFieldValue('companyName', result.name)
    setFieldValue('address', `${result.address}, ${result.postalCode} ${result.city}`)
    manualMode.value = false
  }
})

// Si l'auto-complétion échoue, passer en mode manuel
watch(siretError, (err) => {
  if (err) {
    manualMode.value = true
  }
})

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  emit('submit', {
    siret: values.siret,
    companyName: values.companyName,
    address: values.address,
  })
})
</script>

<template>
  <form class="register-step2" @submit.prevent="onSubmit">
    <div class="register-step2__siret-field">
      <BelInput
        v-model="siret"
        label="SIRET"
        placeholder="14 chiffres"
        :error="siretFieldError"
        :maxlength="14"
        required
      />
      <span v-if="siretLoading" class="register-step2__siret-spinner" aria-label="Recherche...">
        &#x23F3;
      </span>
    </div>

    <p v-if="siretError && !manualMode" class="register-step2__siret-error">
      {{ siretError }}
    </p>

    <p v-if="manualMode" class="register-step2__manual-notice">
      Saisie automatique indisponible. Veuillez remplir manuellement.
    </p>

    <BelInput
      v-model="companyName"
      label="Nom de la société"
      placeholder="Nom de la société"
      :error="companyNameError"
      :disabled="!!siretResult && !manualMode"
      required
    />

    <BelInput
      v-model="address"
      label="Adresse"
      placeholder="Adresse de la société"
      :error="addressError"
      required
    />

    <p v-if="serverError" class="register-step2__error" role="alert">
      {{ serverError }}
    </p>

    <BelButton label="VALIDER" type="submit" :loading="isSubmitting" />
  </form>
</template>
