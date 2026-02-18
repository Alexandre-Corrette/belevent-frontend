<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema } from '~/validation/auth'

definePageMeta({ layout: 'auth', middleware: ['guest'] })

const authStore = useAuthStore()
const router = useRouter()

const serverError = ref('')
const loginCooldown = ref(false)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  if (loginCooldown.value) return

  serverError.value = ''

  try {
    await authStore.login({ email: values.email, password: values.password })

    if (authStore.isPresta) {
      await router.push('/presta')
    } else if (authStore.isUser) {
      await router.push('/user')
    } else {
      await router.push('/')
    }
  } catch {
    serverError.value = 'Identifiants incorrects'
    // Anti-brute-force côté UI : cooldown 3s
    loginCooldown.value = true
    setTimeout(() => {
      loginCooldown.value = false
    }, 3000)
  }
})
</script>

<template>
  <div class="auth-login">
    <h1 class="auth-login__title">Connexion</h1>

    <form class="auth-login__form" @submit.prevent="onSubmit">
      <BelInput
        v-model="email"
        label="Identifiant"
        type="email"
        placeholder="votre@email.com"
        :error="emailError"
        required
      />

      <BelInput
        v-model="password"
        label="Mot de passe"
        type="password"
        placeholder="Votre mot de passe"
        :error="passwordError"
        required
      />

      <p v-if="serverError" class="auth-login__error" role="alert">
        {{ serverError }}
      </p>

      <BelButton
        label="VALIDER"
        type="submit"
        :loading="isSubmitting"
        :disabled="loginCooldown"
      />
    </form>

    <div class="auth-login__links">
      <NuxtLink to="/auth/forgot-password" class="auth-login__link">
        Mot de passe oublié ?
      </NuxtLink>
      <NuxtLink to="/auth/register" class="auth-login__link">
        Créer un compte
      </NuxtLink>
    </div>
  </div>
</template>
