<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { firstLoginSchema, loginSchema } from '~/validation/auth'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => route.query.token as string | undefined)
const prefilledEmail = ref('')
const step = ref<'login' | 'change-password'>('login')
const serverError = ref('')
const tokenError = ref('')

// Vérifier le token au montage
onMounted(async () => {
  if (!token.value) {
    tokenError.value = 'Lien invalide. Veuillez utiliser le lien reçu par email.'
    return
  }

  try {
    const data = await authStore.verifyInvitationToken(token.value)
    prefilledEmail.value = data.email
  } catch {
    tokenError.value = "Ce lien d'invitation est expiré ou invalide."
  }
})

// --- Login form ---
const {
  handleSubmit: handleLoginSubmit,
  isSubmitting: loginSubmitting,
} = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const { value: loginEmail } = useField<string>('email')
const { value: loginPassword, errorMessage: loginPasswordError } =
  useField<string>('password')

// Sync prefilled email
watch(prefilledEmail, (val) => {
  loginEmail.value = val
})

const onLogin = handleLoginSubmit(async (values) => {
  serverError.value = ''
  try {
    await authStore.login({ email: values.email, password: values.password })
    // Si mot de passe temporaire, passer au changement
    if (authStore.needsPasswordChange) {
      step.value = 'change-password'
    } else {
      await router.push('/user')
    }
  } catch {
    serverError.value = 'Identifiants incorrects'
  }
})

// --- Change password form ---
const {
  handleSubmit: handleChangeSubmit,
  isSubmitting: changeSubmitting,
} = useForm({
  validationSchema: toTypedSchema(firstLoginSchema),
})

const { value: newPassword, errorMessage: newPasswordError } =
  useField<string>('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword')

const onChangePassword = handleChangeSubmit(async (values) => {
  serverError.value = ''
  try {
    await authStore.changePassword(loginPassword.value, values.password)
    await router.push('/user')
  } catch {
    serverError.value = 'Impossible de changer le mot de passe'
  }
})
</script>

<template>
  <div class="auth-first-login">
    <!-- Token error -->
    <template v-if="tokenError">
      <h1 class="auth-first-login__title">Lien invalide</h1>
      <p class="auth-first-login__error" role="alert">{{ tokenError }}</p>
      <NuxtLink to="/auth/login" class="auth-first-login__link">
        Retour à la connexion
      </NuxtLink>
    </template>

    <!-- Step 1: Login avec mot de passe temporaire -->
    <template v-else-if="step === 'login'">
      <h1 class="auth-first-login__title">Première connexion</h1>
      <p class="auth-first-login__subtitle">
        Saisissez le mot de passe temporaire reçu par email.
      </p>

      <form class="auth-first-login__form" @submit.prevent="onLogin">
        <BelInput
          v-model="loginEmail"
          label="Identifiant"
          type="email"
          disabled
        />

        <BelInput
          v-model="loginPassword"
          label="Mot de passe temporaire"
          type="password"
          placeholder="Mot de passe reçu par email"
          :error="loginPasswordError"
          required
        />

        <p v-if="serverError" class="auth-first-login__error" role="alert">
          {{ serverError }}
        </p>

        <BelButton label="VALIDER" type="submit" :loading="loginSubmitting" />
      </form>
    </template>

    <!-- Step 2: Changement de mot de passe -->
    <template v-else>
      <h1 class="auth-first-login__title">Nouveau mot de passe</h1>
      <p class="auth-first-login__subtitle">
        Choisissez votre nouveau mot de passe.
      </p>

      <form class="auth-first-login__form" @submit.prevent="onChangePassword">
        <BelInput
          v-model="newPassword"
          label="Nouveau mot de passe"
          type="password"
          placeholder="Min. 8 caractères"
          :error="newPasswordError"
          required
        />

        <PasswordStrengthIndicator v-if="newPassword" :password="newPassword" />

        <BelInput
          v-model="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Confirmez votre mot de passe"
          :error="confirmPasswordError"
          required
        />

        <p v-if="serverError" class="auth-first-login__error" role="alert">
          {{ serverError }}
        </p>

        <BelButton label="VALIDER" type="submit" :loading="changeSubmitting" />
      </form>
    </template>
  </div>
</template>
