<script setup lang="ts">
import type { Transaction } from '~/types'

const companyStore = useCompanyStore()
const { apiFetch } = useApi()

const balance = ref<number | null>(null)
const iban = ref('')
const bic = ref('')
const transactions = ref<Transaction[]>([])
const loading = ref(false)

const transactionColumns = [
  { key: 'number', label: 'N°', width: '100px' },
  { key: 'date', label: 'Date', width: '120px' },
  { key: 'clientName', label: 'Client' },
  { key: 'amount', label: 'Montant', width: '120px' },
  { key: 'designation', label: 'Désignation' },
]

async function fetchBankInfo() {
  if (!companyStore.currentCompany) return
  loading.value = true

  try {
    const data = await apiFetch<{
      iban: string
      bic: string
      balance: number
      transactions: Transaction[]
    }>(`/presta/companies/${companyStore.currentCompany.id}/bank`)

    // SÉCURITÉ : l'IBAN est déjà masqué côté backend
    iban.value = data.iban
    bic.value = data.bic
    balance.value = data.balance
    transactions.value = data.transactions
  } catch {
    // Données non disponibles
  } finally {
    loading.value = false
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount / 100)
}

onMounted(() => {
  fetchBankInfo()
})
</script>

<template>
  <div class="bank-tab">
    <!-- Coordonnées bancaires -->
    <div class="bank-tab__section">
      <h3 class="bank-tab__section-title">Coordonnées bancaires</h3>

      <template v-if="iban">
        <div class="bank-tab__field">
          <span class="bank-tab__label">IBAN</span>
          <span class="bank-tab__value">{{ iban }}</span>
        </div>
        <div class="bank-tab__field">
          <span class="bank-tab__label">BIC</span>
          <span class="bank-tab__value">{{ bic }}</span>
        </div>
      </template>

      <p v-else class="bank-tab__warning">
        Coordonnées bancaires non renseignées. Complétez votre vérification Stripe.
      </p>
    </div>

    <!-- Stripe -->
    <div class="bank-tab__section">
      <h3 class="bank-tab__section-title">Compte Stripe</h3>

      <div v-if="balance !== null" class="bank-tab__field">
        <span class="bank-tab__label">Solde</span>
        <span class="bank-tab__value bank-tab__value--bold">{{ formatAmount(balance) }}</span>
      </div>

      <StripeStatusCard
        :kbis-status="companyStore.isStripeVerified ? 'done' : 'pending'"
        :identity-status="companyStore.isStripeVerified ? 'done' : 'pending'"
        :rib-status="companyStore.isStripeVerified ? 'done' : 'pending'"
      />
    </div>

    <!-- Transactions -->
    <div class="bank-tab__section">
      <h3 class="bank-tab__section-title">Mes Transactions</h3>

      <BelTable
        :columns="transactionColumns"
        :data="(transactions as unknown as Record<string, unknown>[])"
        :loading="loading"
        empty-message="Aucune transaction"
      >
        <template #cell-amount="{ value }">
          {{ formatAmount(value as number) }}
        </template>
      </BelTable>
    </div>
  </div>
</template>
