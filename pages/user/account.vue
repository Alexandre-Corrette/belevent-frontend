<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { passwordComplexity } from '~/validation/auth'

definePageMeta({ layout: 'user', middleware: ['auth'] })

const authStore = useAuthStore()
const { apiFetch } = useApi()
const { result: siretResult, loading: siretLoading, searchSiret } = useSiret()

// --- State ---
const user = computed(() => authStore.user)
const editingField = ref<string | null>(null)
const saving = ref(false)
const isCompanyAccount = ref(false)
const showPasswordModal = ref(false)

// Bank info (masked IBAN from backend)
const iban = ref('')
const bic = ref('')

// --- Field editing ---
const editValue = ref('')

function startEdit(field: string) {
  if (!user.value) return
  switch (field) {
    case 'address':
      editValue.value = '' // Would need to fetch from user profile
      break
    case 'phone':
      editValue.value = '' // Would need to fetch from user profile
      break
  }
  editingField.value = field
}

async function saveField() {
  if (!editingField.value) return
  saving.value = true
  try {
    await apiFetch('/user/profile', {
      method: 'PUT',
      body: { [editingField.value]: editValue.value },
    })
    await authStore.fetchMe()
    editingField.value = null
  } finally {
    saving.value = false
  }
}

// --- Password change ---
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordComplexity,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

const {
  handleSubmit: handlePasswordSubmit,
  isSubmitting: passwordSubmitting,
  resetForm: resetPasswordForm,
} = useForm({
  validationSchema: toTypedSchema(passwordSchema),
})

const { value: currentPassword, errorMessage: currentPwError } =
  useField<string>('currentPassword')
const { value: newPassword, errorMessage: newPwError } = useField<string>('newPassword')
const { value: confirmPw, errorMessage: confirmPwError } = useField<string>('confirmPassword')

const passwordError = ref('')

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  passwordError.value = ''
  try {
    await authStore.changePassword(values.currentPassword, values.newPassword)
    showPasswordModal.value = false
    resetPasswordForm()
  } catch {
    passwordError.value = 'Mot de passe actuel incorrect'
  }
})

// --- Company account (SIRET) ---
const siretValue = ref('')
const companyName = ref('')
const companyAddress = ref('')

watch(siretValue, (val) => {
  if (val.replace(/\s/g, '').length === 14) {
    searchSiret(val)
  }
})

watch(siretResult, (result) => {
  if (result) {
    companyName.value = result.name
    companyAddress.value = `${result.address}, ${result.postalCode} ${result.city}`
  }
})

// --- Fetch bank info ---
async function fetchBankInfo() {
  try {
    const data = await apiFetch<{ iban: string; bic: string }>('/user/bank')
    iban.value = data.iban
    bic.value = data.bic
  } catch {
    // Not available
  }
}

onMounted(() => {
  fetchBankInfo()
})
</script>

<template>
  <div class="user-account">
    <h1 class="user-account__title">Mon Compte</h1>

    <!-- MES COORDONNÉES -->
    <section class="user-account__section">
      <h2 class="user-account__section-title">Mes Coordonnées</h2>

      <div class="user-account__grid">
        <div class="user-account__field">
          <span class="user-account__label">Nom</span>
          <span class="user-account__value">{{ user?.firstName }} {{ user?.lastName }}</span>
        </div>

        <div class="user-account__field">
          <span class="user-account__label">Identifiant</span>
          <span class="user-account__value">{{ user?.email }}</span>
        </div>

        <div class="user-account__field">
          <span class="user-account__label">Mot de passe</span>
          <span class="user-account__value">••••••••</span>
        </div>
      </div>

      <BelButton
        label="Modifier mes identifiants"
        variant="outline"
        size="sm"
        @click="showPasswordModal = true"
      />
    </section>

    <!-- MES COORDONNÉES BANCAIRES -->
    <section class="user-account__section">
      <h2 class="user-account__section-title">Mes Coordonnées Bancaires</h2>

      <template v-if="iban">
        <div class="user-account__grid">
          <div class="user-account__field">
            <span class="user-account__label">IBAN</span>
            <span class="user-account__value user-account__value--mono">{{ iban }}</span>
          </div>
          <div class="user-account__field">
            <span class="user-account__label">BIC</span>
            <span class="user-account__value user-account__value--mono">{{ bic }}</span>
          </div>
        </div>
      </template>

      <p v-else class="user-account__warning">
        Coordonnées bancaires non renseignées.
      </p>
    </section>

    <!-- COMPTE ENTREPRISE -->
    <section class="user-account__section">
      <label class="user-account__checkbox">
        <input v-model="isCompanyAccount" type="checkbox" />
        Compte entreprise
      </label>

      <template v-if="isCompanyAccount">
        <div class="user-account__company-form">
          <div class="user-account__siret-field">
            <BelInput
              v-model="siretValue"
              label="SIRET"
              placeholder="14 chiffres"
              :maxlength="14"
            />
            <span v-if="siretLoading" class="user-account__siret-spinner">&#x23F3;</span>
          </div>
          <BelInput v-model="companyName" label="Nom de la société" :disabled="!!siretResult" />
          <BelInput v-model="companyAddress" label="Adresse" />
        </div>
      </template>
    </section>

    <!-- Modal changement mot de passe -->
    <BelModal v-model="showPasswordModal" title="Modifier mes identifiants">
      <form class="user-account__password-form" @submit.prevent="onPasswordSubmit">
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
          label="Confirmer"
          type="password"
          :error="confirmPwError"
          required
        />

        <p v-if="passwordError" class="user-account__error" role="alert">
          {{ passwordError }}
        </p>
      </form>

      <template #footer>
        <BelButton label="Annuler" variant="ghost" @click="showPasswordModal = false" />
        <BelButton label="VALIDER" :loading="passwordSubmitting" @click="onPasswordSubmit" />
      </template>
    </BelModal>
  </div>
</template>
