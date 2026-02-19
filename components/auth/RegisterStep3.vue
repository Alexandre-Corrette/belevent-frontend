<script setup lang="ts">
const companyStore = useCompanyStore()
const router = useRouter()

const loading = ref(false)
const pollingStatus = ref(false)
const error = ref('')

const stripeStatus = ref({
  kbis: 'pending' as 'done' | 'pending' | 'rejected',
  identity: 'pending' as 'done' | 'pending' | 'rejected',
  rib: 'pending' as 'done' | 'pending' | 'rejected',
})

const allVerified = computed(
  () =>
    stripeStatus.value.kbis === 'done' &&
    stripeStatus.value.identity === 'done' &&
    stripeStatus.value.rib === 'done',
)

async function startStripeOnboarding() {
  loading.value = true
  error.value = ''
  try {
    const url = await companyStore.initStripeOnboarding()
    // Ouvrir Stripe dans un nouvel onglet (sécurité : pas d'iframe)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    error.value = "Impossible d'initialiser la vérification Stripe"
  } finally {
    loading.value = false
  }
}

async function checkStatus() {
  pollingStatus.value = true
  try {
    await companyStore.fetchStripeStatus()
    const company = companyStore.currentCompany
    if (company) {
      const onboardingStatus = company.stripeOnboardingStatus

      if (company.stripeChargesEnabled && company.stripePayoutsEnabled) {
        stripeStatus.value = { kbis: 'done', identity: 'done', rib: 'done' }
      } else if (onboardingStatus === 'rejected') {
        stripeStatus.value = { kbis: 'rejected', identity: 'rejected', rib: 'rejected' }
      }
      // Statut intermédiaire : on laisse "pending"
    }
  } catch {
    error.value = 'Impossible de vérifier le statut'
  } finally {
    pollingStatus.value = false
  }
}

async function complete() {
  await router.push('/presta')
}

onMounted(() => {
  checkStatus()
})
</script>

<template>
  <div class="register-step3">
    <h2 class="register-step3__title">Vérification Stripe Connect</h2>

    <p class="register-step3__description">
      Pour recevoir des paiements, vos documents juridiques doivent être vérifiés par Stripe.
    </p>

    <StripeStatusCard
      :kbis-status="stripeStatus.kbis"
      :identity-status="stripeStatus.identity"
      :rib-status="stripeStatus.rib"
    />

    <p v-if="error" class="register-step3__error" role="alert">
      {{ error }}
    </p>

    <div class="register-step3__actions">
      <BelButton
        v-if="!allVerified"
        label="Lancer la vérification Stripe"
        :loading="loading"
        @click="startStripeOnboarding"
      />

      <BelButton
        v-if="!allVerified"
        label="Vérifier le statut"
        variant="outline"
        :loading="pollingStatus"
        @click="checkStatus"
      />

      <BelButton
        v-if="allVerified"
        label="VALIDER"
        @click="complete"
      />
    </div>

    <p v-if="!allVerified" class="register-step3__notice">
      Vérification en cours ? Vous recevrez un email quand tout sera validé.
    </p>

    <button
      v-if="!allVerified"
      class="register-step3__skip"
      type="button"
      @click="complete"
    >
      Configurer plus tard
    </button>
  </div>
</template>