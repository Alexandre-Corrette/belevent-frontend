<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { forgotPasswordSchema } from '~/validation/auth'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const authStore = useAuthStore()
const success = ref(false)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')

const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.forgotPassword(values.email)
  } catch {
    // On affiche le même message quoi qu'il arrive (anti-énumération d'emails)
  }
  // Toujours afficher le succès (sécurité)
  success.value = true
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

        <BelButton label="ENVOYER" type="submit" :loading="isSubmitting" />
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
