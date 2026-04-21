<script setup lang="ts">
import type { EventCategory, EventStatus } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const eventsStore = useEventsStore()
const companyStore = useCompanyStore()

const { filters } = useFilters<{ month: string; status: string; search: string }>({
  month: '',
  status: '',
  search: '',
})

const searchLocal = ref(filters.value.search)
watch(() => filters.value.search, (val) => {
  if (val !== searchLocal.value) searchLocal.value = val
})

// BelDatePicker month mode emits YYYY-MM-01 ; filter stores YYYY-MM
const monthValue = computed({
  get: () => (filters.value.month ? `${filters.value.month}-01` : ''),
  set: (val: string) => {
    filters.value.month = val ? val.slice(0, 7) : ''
  },
})

const CATEGORY_LABELS: Record<EventCategory, string> = {
  mariage: 'Mariage',
  seminaire: 'Séminaire',
  reception: 'Réception',
  anniversaire: 'Anniversaire',
  communion: 'Communion',
  autre: 'Autre',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  inquiry: 'Demande',
  quoted: 'Devis envoyé',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'inquiry', label: STATUS_LABELS.inquiry },
  { value: 'quoted', label: STATUS_LABELS.quoted },
  { value: 'confirmed', label: STATUS_LABELS.confirmed },
  { value: 'cancelled', label: STATUS_LABELS.cancelled },
]

const COLUMNS = [
  { key: 'title', label: 'Titre', sortable: true },
  { key: 'category', label: 'Type' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'guestCount', label: 'Invités' },
  { key: 'clientName', label: 'Client' },
  { key: 'status', label: 'Statut' },
]

function formatDate(date: string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function applyFilters() {
  await eventsStore.fetchEvents({
    month: filters.value.month || undefined,
    status: (filters.value.status || undefined) as EventStatus | undefined,
    search: filters.value.search || undefined,
  })
}

function onRowClick(row: Record<string, unknown>) {
  navigateTo(`/presta/events/${row.id}`)
}

function onCreate() {
  navigateTo('/presta/events/new')
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
  <div class="presta-events">
    <div class="presta-events__header">
      <h1 class="presta-events__title">Mes événements</h1>
      <div class="presta-events__header-actions">
        <CompanySelector />
        <BelButton label="Nouvel événement" icon="+" variant="primary" @click="onCreate" />
      </div>
    </div>

    <div class="presta-events__toolbar">
      <div class="presta-events__toolbar-filter">
        <BelDatePicker v-model="monthValue" mode="month" label="Mois" />
      </div>
      <div class="presta-events__toolbar-filter">
        <BelSelect
          v-model="filters.status"
          label="Statut"
          :options="STATUS_OPTIONS"
          placeholder="Tous les statuts"
        />
      </div>
      <div class="presta-events__toolbar-search">
        <BelSearchInput
          v-model="searchLocal"
          placeholder="Rechercher un événement…"
          :loading="eventsStore.loading"
          @search="filters.search = $event"
        />
      </div>
    </div>

    <BelEmptyState
      v-if="!eventsStore.loading && eventsStore.events.length === 0"
      icon="📅"
      message="Aucun événement ne correspond à vos critères."
      action-label="Nouvel événement"
      @action="onCreate"
    />

    <BelTable
      v-else
      :columns="COLUMNS"
      :data="(eventsStore.events as unknown as Record<string, unknown>[])"
      :loading="eventsStore.loading"
      empty-message="Aucun événement"
      @row-click="onRowClick"
    >
      <template #cell-category="{ value }">
        {{ CATEGORY_LABELS[value as EventCategory] ?? value }}
      </template>

      <template #cell-date="{ value }">
        {{ formatDate(value as string) }}
      </template>

      <template #cell-guestCount="{ value }">
        {{ value ?? '—' }}
      </template>

      <template #cell-status="{ value }">
        <span
          :class="[
            'presta-events__status',
            `presta-events__status--${value}`,
          ]"
        >
          {{ STATUS_LABELS[value as EventStatus] ?? value }}
        </span>
      </template>
    </BelTable>
  </div>
</template>
