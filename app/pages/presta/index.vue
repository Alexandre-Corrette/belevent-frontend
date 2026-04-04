<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const dashboardStore = useDashboardStore()
const companyStore = useCompanyStore()

const AGENDA_TYPE_LABELS: Record<string, string> = {
  send_quote: 'Devis',
  send_invoice: 'Facture',
  send_contract: 'Contrat',
  process_request: 'Demande',
  payment: 'Paiement',
}

function formatDueDate(date?: string): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

// Fetch au montage
onMounted(() => {
  dashboardStore.fetchDashboard()
  dashboardStore.fetchAgenda()
})

// Refetch quand la company change
watch(
  () => companyStore.currentCompany?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      dashboardStore.fetchDashboard()
      dashboardStore.fetchAgenda()
    }
  },
)
</script>

<template>
  <div class="presta-dashboard">
    <div class="presta-dashboard__header">
      <h1 class="presta-dashboard__title">Tableau de bord</h1>
      <CompanySelector />
    </div>

    <!-- Skeleton loading -->
    <template v-if="dashboardStore.loading">
      <div class="presta-dashboard__stats">
        <BelCard v-for="n in 3" :key="n">
          <div class="presta-dashboard__skeleton-card" />
        </BelCard>
      </div>
      <div class="presta-dashboard__agenda">
        <div v-for="n in 3" :key="n" class="presta-dashboard__skeleton-row" style="margin-bottom: 8px" />
      </div>
    </template>

    <!-- Empty state -->
    <template v-else-if="!dashboardStore.stats">
      <BelEmptyState
        icon="📊"
        message="Aucune donnée disponible. Commencez par rejoindre un événement ou créer un document."
        action-label="Rejoindre un événement"
        @action="navigateTo('/presta/join')"
      />
    </template>

    <!-- Dashboard content -->
    <template v-else>
      <!-- Stats Cards -->
      <div class="presta-dashboard__stats">
        <!-- CA du mois -->
        <BelCard>
          <div class="presta-dashboard__stat-card">
            <BelProgress
              :value="dashboardStore.stats.revenuePercent"
              :max="100"
              size="lg"
              :color="'var(--bel-primary, #5a8a7a)'"
            />
            <div class="presta-dashboard__stat-info">
              <span class="presta-dashboard__stat-label">CA du mois</span>
              <span class="presta-dashboard__stat-value">{{ dashboardStore.revenueFormatted }}</span>
              <span class="presta-dashboard__stat-sub">
                Objectif : {{ dashboardStore.revenueGoalFormatted }}
              </span>
            </div>
          </div>
        </BelCard>

        <!-- Devis signés -->
        <BelCard>
          <div class="presta-dashboard__stat-card">
            <div class="presta-dashboard__stat-info">
              <span class="presta-dashboard__stat-label">Devis signés</span>
              <span class="presta-dashboard__stat-value">{{ dashboardStore.quotesSignedFormatted }}</span>
              <span class="presta-dashboard__stat-sub">
                {{ dashboardStore.stats.quotesSigned }} devis
              </span>
            </div>
          </div>
        </BelCard>

        <!-- Factures en attente -->
        <BelCard>
          <div class="presta-dashboard__stat-card">
            <div class="presta-dashboard__stat-info">
              <span class="presta-dashboard__stat-label">Factures en attente</span>
              <span class="presta-dashboard__stat-value">{{ dashboardStore.invoicesPendingFormatted }}</span>
              <span class="presta-dashboard__stat-sub">
                {{ dashboardStore.stats.invoicesPending }} facture{{ dashboardStore.stats.invoicesPending > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </BelCard>
      </div>

      <!-- Agenda -->
      <div class="presta-dashboard__agenda">
        <div class="presta-dashboard__agenda-header">
          <h2 class="presta-dashboard__agenda-title">Agenda</h2>
          <BelBadge
            v-if="dashboardStore.pendingAgendaItems.length > 0"
            :count="dashboardStore.pendingAgendaItems.length"
            variant="warning"
          />
        </div>

        <BelEmptyState
          v-if="dashboardStore.agenda.length === 0"
          icon="📅"
          message="Aucune tâche dans votre agenda."
        />

        <div v-else class="presta-dashboard__agenda-list">
          <div
            v-for="item in dashboardStore.agenda"
            :key="item.id"
            :class="[
              'presta-dashboard__agenda-item',
              { 'presta-dashboard__agenda-item--done': item.completed },
            ]"
            @click="dashboardStore.toggleAgendaItem(item.id)"
          >
            <button
              :class="[
                'presta-dashboard__agenda-checkbox',
                { 'presta-dashboard__agenda-checkbox--checked': item.completed },
              ]"
            >
              <span v-if="item.completed">✓</span>
            </button>

            <div class="presta-dashboard__agenda-content">
              <div class="presta-dashboard__agenda-label">{{ item.label }}</div>
              <div v-if="item.dueDate" class="presta-dashboard__agenda-due">
                {{ formatDueDate(item.dueDate) }}
              </div>
            </div>

            <span class="presta-dashboard__agenda-type">
              {{ AGENDA_TYPE_LABELS[item.type] ?? item.type }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
