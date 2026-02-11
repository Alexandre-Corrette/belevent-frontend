<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { registerStep1Schema } from '~/validation/auth'

const emit = defineEmits<{
  submit: [data: { email: string; password: string; firstName: string; lastName: string }]
}>()

const serverError = ref('')

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(registerStep1Schema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword')
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')

defineExpose({ serverError })

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  emit('submit', {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
  })
})
</script>

<template>
  <form class="register-step1" @submit.prevent="onSubmit">
    <BelInput
      v-model="email"
      label="Email"
      type="email"
      placeholder="votre@email.com"
      :error="emailError || (serverError ? serverError : undefined)"
      required
    />

    <BelInput v-model="firstName" label="Prénom" placeholder="Prénom" :error="firstNameError" required />

    <BelInput v-model="lastName" label="Nom" placeholder="Nom" :error="lastNameError" required />

    <BelInput
      v-model="password"
      label="Mot de passe"
      type="password"
      placeholder="Min. 8 caractères"
      :error="passwordError"
      required
    />

    <PasswordStrengthIndicator v-if="password" :password="password" />

    <BelInput
      v-model="confirmPassword"
      label="Confirmer le mot de passe"
      type="password"
      placeholder="Confirmez votre mot de passe"
      :error="confirmPasswordError"
      required
    />

    <BelButton label="VALIDER" type="submit" :loading="isSubmitting" />
  </form>
</template>
