<script setup lang="ts">
import type { DocumentStatus, DocumentType, PrestaDocument } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

type TabKey = 'all' | 'devis' | 'facture'

const route = useRoute()
const router = useRouter()

const documentsStore = useDocumentsStore()
const companyStore = useCompanyStore()

const { filters } = useFilters<{ month: string; status: string }>({
  month: '',
  status: '',
})

// BelDatePicker month mode emits YYYY-MM-01 ; filter stores YYYY-MM
const monthValue = computed({
  get: () => (filters.value.month ? `${filters.value.month}-01` : ''),
  set: (val: string) => {
    filters.value.month = val ? val.slice(0, 7) : ''
  },
})

const activeTab = computed<TabKey>({
  get: () => {
    const q = route.query.tab as TabKey | undefined
    if (q === 'devis' || q === 'facture' || q === 'all') return q
    return 'all'
  },
  set: (val) => {
    router.replace({ query: { ...route.query, tab: val } })
  },
})

const TYPE_LABELS: Record<DocumentType, string> = {
  devis: 'Devis',
  facture: 'Facture',
  contrat: 'Contrat',
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
  paid: 'Payé',
}

const COLUMNS = [
  { key: 'documentNumber', label: 'N° Pièce', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'designation', label: 'Prestation' },
  { key: 'clientName', label: 'Client' },
  { key: 'amount', label: 'Montant', sortable: true },
  { key: 'status', label: 'Statut' },
  { key: 'createdAt', label: 'Date', sortable: true },
]

const tabs = computed(() => [
  {
    key: 'all',
    label: 'Tous',
    badge: documentsStore.devis.length + documentsStore.factures.length,
  },
  { key: 'devis', label: 'Devis', badge: documentsStore.devis.length },
  { key: 'facture', label: 'Factures', badge: documentsStore.factures.length },
])

const displayedDocs = computed<PrestaDocument[]>(() => {
  switch (activeTab.value) {
    case 'devis':
      return documentsStore.devis
    case 'facture':
      return documentsStore.factures
    case 'all':
    default:
      return [...documentsStore.devis, ...documentsStore.factures].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
  }
})

function formatAmount(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(date?: string): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function applyFilters() {
  await documentsStore.fetchDocuments({
    month: filters.value.month || undefined,
    status: (filters.value.status || undefined) as DocumentStatus | undefined,
  })
}

function onCreate() {
  navigateTo('/presta/documents/new')
}

onMounted(applyFilters)

watch(filters, applyFilters, { deep: true })

watch(
  () => companyStore.currentCompany?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) applyFilters()
  },
)
</script>

<template>
  <div class="presta-documents">
    <div class="presta-documents__header">
      <h1 class="presta-documents__title">Mes documents</h1>
      <div class="presta-documents__header-actions">
        <CompanySelector />
        <BelButton label="Nouveau document" icon="+" variant="primary" @click="onCreate" />
      </div>
    </div>

    <div class="presta-documents__toolbar">
      <BelDatePicker v-model="monthValue" mode="month" label="Mois" />
    </div>

    <BelTabs v-model="activeTab" :tabs="tabs" />

    <BelEmptyState
      v-if="!documentsStore.loading && displayedDocs.length === 0"
      icon="📄"
      message="Aucun document ne correspond à vos critères."
      action-label="Nouveau document"
      @action="onCreate"
    />

    <BelTable
      v-else
      :columns="COLUMNS"
      :data="(displayedDocs as unknown as Record<string, unknown>[])"
      :loading="documentsStore.loading"
      empty-message="Aucun document"
    >
      <template #cell-type="{ value }">
        <span
          :class="[
            'presta-documents__type',
            `presta-documents__type--${value}`,
          ]"
        >
          {{ TYPE_LABELS[value as DocumentType] ?? value }}
        </span>
      </template>

      <template #cell-amount="{ value }">
        {{ formatAmount(value as number) }}
      </template>

      <template #cell-status="{ value }">
        <span
          :class="[
            'presta-documents__status',
            `presta-documents__status--${value}`,
          ]"
        >
          {{ STATUS_LABELS[value as DocumentStatus] ?? value }}
        </span>
      </template>

      <template #cell-createdAt="{ value }">
        {{ formatDate(value as string) }}
      </template>
    </BelTable>
  </div>
</template>
