<script setup lang="ts">
import type { PrestaClient } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const clientsStore = useClientsStore()
const companyStore = useCompanyStore()
const { show: showToast } = useToast()

const searchQuery = ref('')
const selectedClientId = ref<number | null>(null)
const showInviteModal = ref(false)

const filteredClients = computed<PrestaClient[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = clientsStore.clientsByName
  if (!q) return list
  return list.filter((c) => {
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })
})

const selectedClient = computed<PrestaClient | null>(() => {
  if (selectedClientId.value === null) return null
  return clientsStore.clients.find((c) => c.id === selectedClientId.value) ?? null
})

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}***@${domain}`
}

function formatDate(date?: string): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function onInvited(result: { status: number; client: PrestaClient }) {
  if (result.status === 201) {
    showToast("Nouveau client invité, un email d'invitation a été envoyé.")
  } else {
    showToast('Ce client existe déjà dans votre liste.')
  }
  selectedClientId.value = result.client.id
}

function openDetailPage(id: number) {
  navigateTo(`/presta/clients/${id}`)
}

onMounted(() => {
  clientsStore.fetchClients()
})

watch(
  () => companyStore.currentCompany?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      selectedClientId.value = null
      clientsStore.fetchClients()
    }
  },
)
</script>

<template>
  <div class="presta-clients">
    <div class="presta-clients__header">
      <h1 class="presta-clients__title">Mes clients</h1>
      <div class="presta-clients__header-actions">
        <CompanySelector />
        <BelButton label="Inviter un client" icon="+" variant="primary" @click="showInviteModal = true" />
      </div>
    </div>

    <div class="presta-clients__search">
      <BelSearchInput
        v-model="searchQuery"
        placeholder="Rechercher un client…"
        :loading="clientsStore.loading"
      />
    </div>

    <BelEmptyState
      v-if="!clientsStore.loading && clientsStore.clients.length === 0"
      icon="👥"
      message="Aucun client pour le moment."
      action-label="Inviter un client"
      @action="showInviteModal = true"
    />

    <BelMasterDetail
      v-else
      :show-detail="!!selectedClient"
      @back="selectedClientId = null"
    >
      <template #master>
        <ul class="presta-clients__list">
          <li
            v-for="client in filteredClients"
            :key="client.id"
            :class="[
              'presta-clients__list-item',
              { 'presta-clients__list-item--active': selectedClientId === client.id },
            ]"
            @click="selectedClientId = client.id"
          >
            <div class="presta-clients__list-info">
              <span class="presta-clients__list-name">
                {{ client.firstName }} {{ client.lastName }}
              </span>
              <span class="presta-clients__list-email">{{ maskEmail(client.email) }}</span>
            </div>
            <div class="presta-clients__list-meta">
              <span v-if="client.eventsCount > 0" class="presta-clients__list-count">
                {{ client.eventsCount }} événement{{ client.eventsCount > 1 ? 's' : '' }}
              </span>
              <span v-if="client.documentsCount > 0" class="presta-clients__list-count presta-clients__list-count--docs">
                {{ client.documentsCount }} doc{{ client.documentsCount > 1 ? 's' : '' }}
              </span>
            </div>
          </li>

          <li v-if="filteredClients.length === 0" class="presta-clients__list-empty">
            Aucun client ne correspond à votre recherche.
          </li>
        </ul>
      </template>

      <template #detail>
        <div v-if="selectedClient" class="presta-clients__detail">
          <header class="presta-clients__detail-header">
            <h2 class="presta-clients__detail-title">
              {{ selectedClient.firstName }} {{ selectedClient.lastName }}
            </h2>
            <BelButton
              label="Ouvrir la fiche complète"
              variant="outline"
              size="sm"
              @click="openDetailPage(selectedClient.id)"
            />
          </header>

          <dl class="presta-clients__detail-meta">
            <div>
              <dt>Email</dt>
              <dd>{{ selectedClient.email }}</dd>
            </div>
            <div v-if="selectedClient.phone">
              <dt>Téléphone</dt>
              <dd>{{ selectedClient.phone }}</dd>
            </div>
            <div>
              <dt>Événements</dt>
              <dd>{{ selectedClient.eventsCount }}</dd>
            </div>
            <div>
              <dt>Documents</dt>
              <dd>{{ selectedClient.documentsCount }}</dd>
            </div>
            <div v-if="selectedClient.lastActivity">
              <dt>Dernière activité</dt>
              <dd>{{ formatDate(selectedClient.lastActivity) }}</dd>
            </div>
          </dl>
        </div>
      </template>
    </BelMasterDetail>

    <ClientInviteModal v-model="showInviteModal" @invited="onInvited" />
  </div>
</template>
