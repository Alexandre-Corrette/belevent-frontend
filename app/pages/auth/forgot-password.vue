<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { forgotPasswordSchema } from '~/validation/auth'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const authStore = useAuthStore()
const success = ref(false)
const cooldown = ref(false)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')

const onSubmit = handleSubmit(async (values) => {
  if (cooldown.value) return

  const minDelay = new Promise(resolve => setTimeout(resolve, 1000))

  try {
    await Promise.all([authStore.forgotPassword(values.email), minDelay])
  } catch {
    // Même message quoi qu'il arrive (anti-énumération d'emails)
    await minDelay
  }

  success.value = true
  cooldown.value = true
  setTimeout(() => { cooldown.value = false }, 30_000)
})
</script>

<template>
  <div class="auth-forgot-password">
    <h1 class="auth-forgot-password__title">Mot de passe oublié</h1>

    <template v-if="!success">
      <p class="auth-forgot-password__description">
        Saisissez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation.
      </p>

      <form class="auth-forgot-password__form" @submit.prevent="onSubmit">
        <BelInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="votre@email.com"
          :error="emailError"
          required
        />

        <BelButton label="ENVOYER" type="submit" :loading="isSubmitting" :disabled="cooldown" />
      </form>
    </template>

    <template v-else>
      <p class="auth-forgot-password__success">
        Un email a été envoyé si ce compte existe. Vérifiez votre boîte de réception.
      </p>
    </template>

    <NuxtLink to="/auth/login" class="auth-forgot-password__link">
      Retour à la connexion
    </NuxtLink>
  </div>
</template>
