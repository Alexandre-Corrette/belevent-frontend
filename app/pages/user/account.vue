<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { profileSchema, changePasswordSchema } from '~/validation/auth'

definePageMeta({ layout: 'user', middleware: ['auth'] })

const authStore = useAuthStore()
const { show: showToast } = useToast()

const user = computed(() => authStore.user)

// --- Profile form ---
const {
  handleSubmit: handleProfileSubmit,
  isSubmitting: profileSubmitting,
  resetForm: resetProfileForm,
} = useForm({
  validationSchema: toTypedSchema(profileSchema),
})

const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')
const { value: phone, errorMessage: phoneError } = useField<string>('phone')

const profileError = ref('')

// Pre-fill from user data
watch(user, (u) => {
  if (u) {
    resetProfileForm({
      values: {
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone ?? '',
      },
    })
  }
}, { immediate: true })

const onProfileSubmit = handleProfileSubmit(async (values) => {
  profileError.value = ''
  try {
    await authStore.updateProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
    })
    showToast('Informations mises à jour')
  } catch {
    profileError.value = 'Impossible de mettre à jour les informations'
  }
})

// --- Password form ---
const {
  handleSubmit: handlePasswordSubmit,
  isSubmitting: passwordSubmitting,
  resetForm: resetPasswordForm,
} = useForm({
  validationSchema: toTypedSchema(changePasswordSchema),
})

const { value: currentPassword, errorMessage: currentPwError } =
  useField<string>('currentPassword')
const { value: newPassword, errorMessage: newPwError } =
  useField<string>('newPassword')
const { value: confirmPw, errorMessage: confirmPwError } =
  useField<string>('confirmPassword')

const passwordError = ref('')

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  passwordError.value = ''
  try {
    await authStore.changePassword(values.currentPassword, values.newPassword)
    resetPasswordForm()
    showToast('Mot de passe modifié')
  } catch {
    passwordError.value = 'Mot de passe actuel incorrect'
  }
})
</script>

<template>
  <div class="user-account">
    <h1 class="user-account__title">Mon Compte</h1>

    <!-- INFORMATIONS PERSONNELLES -->
    <section class="user-account__section">
      <h2 class="user-account__section-title">Informations personnelles</h2>

      <form class="user-account__form" @submit.prevent="onProfileSubmit">
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

        <BelInput
          :model-value="user?.email ?? ''"
          label="Email"
          type="email"
          disabled
        />

        <BelInput
          v-model="phone"
          label="Téléphone"
          type="tel"
          placeholder="06 12 34 56 78"
          :error="phoneError"
        />

        <p v-if="profileError" class="user-account__error" role="alert">
          {{ profileError }}
        </p>

        <BelButton
          label="Enregistrer"
          type="submit"
          :loading="profileSubmitting"
        />
      </form>
    </section>

    <!-- CHANGEMENT DE MOT DE PASSE -->
    <section class="user-account__section">
      <h2 class="user-account__section-title">Changer le mot de passe</h2>

      <form class="user-account__form" @submit.prevent="onPasswordSubmit">
        <BelInput
          v-model="currentPassword"
          label="Mot de passe actuel"
          type="password"
          :error="currentPwError"
          required
        />

        <BelInput
          v-model="newPassword"
          label="Nouveau mot de passe"
          type="password"
          placeholder="Min. 8 caractères"
          :error="newPwError"
          required
        />

        <PasswordStrengthIndicator v-if="newPassword" :password="newPassword" />

        <BelInput
          v-model="confirmPw"
          label="Confirmer le mot de passe"
          type="password"
          :error="confirmPwError"
          required
        />

        <p v-if="passwordError" class="user-account__error" role="alert">
          {{ passwordError }}
        </p>

        <BelButton
          label="Modifier le mot de passe"
          type="submit"
          :loading="passwordSubmitting"
        />
      </form>
    </section>

    <BelToast />
  </div>
</template>
