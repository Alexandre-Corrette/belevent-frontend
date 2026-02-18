<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { resetPasswordSchema } from '~/validation/auth'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => route.query.token as string | undefined)
const prefilledEmail = ref('')
const serverError = ref('')
const tokenError = ref('')
const tokenValidated = ref(false)

// Valider le token au chargement
onMounted(async () => {
  if (!token.value) {
    tokenError.value = 'Lien invalide.'
    return
  }

  try {
    const data = await authStore.verifyInvitationToken(token.value)
    prefilledEmail.value = data.email
    tokenValidated.value = true
  } catch {
    tokenError.value = 'Ce lien est expiré ou invalide.'
  }
})

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(resetPasswordSchema),
})

const { value: password, errorMessage: passwordError } = useField<string>('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''

  if (!token.value) return

  try {
    await authStore.resetPassword(token.value, values.password)
    await router.push({
      path: '/auth/login',
      query: { message: 'password_changed' },
    })
  } catch {
    serverError.value = 'Impossible de réinitialiser le mot de passe'
  }
})
</script>

<template>
  <div class="auth-reset-password">
    <!-- Token error -->
    <template v-if="tokenError">
      <h1 class="auth-reset-password__title">Lien invalide</h1>
      <p class="auth-reset-password__error" role="alert">{{ tokenError }}</p>
      <NuxtLink to="/auth/forgot-password" class="auth-reset-password__link">
        Demander un nouveau lien
      </NuxtLink>
    </template>

    <!-- Reset form -->
    <template v-else-if="tokenValidated">
      <h1 class="auth-reset-password__title">Nouveau mot de passe</h1>

      <form class="auth-reset-password__form" @submit.prevent="onSubmit">
        <BelInput
          :model-value="prefilledEmail"
          label="Identifiant"
          type="email"
          disabled
        />

        <BelInput
          v-model="password"
          label="Nouveau mot de passe"
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

        <p v-if="serverError" class="auth-reset-password__error" role="alert">
          {{ serverError }}
        </p>

        <BelButton label="VALIDER" type="submit" :loading="isSubmitting" />
      </form>
    </template>

    <!-- Loading -->
    <template v-else>
      <p class="auth-reset-password__loading">Vérification du lien...</p>
    </template>
  </div>
</template>
