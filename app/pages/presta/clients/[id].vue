<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const clientsStore = useClientsStore()

const clientId = computed(() => Number(route.params.id))

function formatDate(date?: string): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function loadClient() {
  if (!Number.isFinite(clientId.value)) return
  await clientsStore.fetchClient(clientId.value)
}

onMounted(loadClient)

watch(clientId, loadClient)
</script>

<template>
  <div class="presta-client-detail">
    <NuxtLink to="/presta/clients" class="presta-client-detail__back">← Retour aux clients</NuxtLink>

    <template v-if="clientsStore.loading && !clientsStore.currentClient">
      <p class="presta-client-detail__loading">Chargement…</p>
    </template>

    <template v-else-if="!clientsStore.currentClient">
      <BelEmptyState
        icon="🔎"
        message="Client introuvable."
        action-label="Retour à la liste"
        @action="navigateTo('/presta/clients')"
      />
    </template>

    <template v-else>
      <header class="presta-client-detail__header">
        <h1 class="presta-client-detail__title">
          {{ clientsStore.currentClient.firstName }} {{ clientsStore.currentClient.lastName }}
        </h1>
      </header>

      <dl class="presta-client-detail__meta">
        <div>
          <dt>Email</dt>
          <dd>{{ clientsStore.currentClient.email }}</dd>
        </div>
        <div v-if="clientsStore.currentClient.phone">
          <dt>Téléphone</dt>
          <dd>{{ clientsStore.currentClient.phone }}</dd>
        </div>
        <div>
          <dt>Événements</dt>
          <dd>{{ clientsStore.currentClient.eventsCount }}</dd>
        </div>
        <div>
          <dt>Documents</dt>
          <dd>{{ clientsStore.currentClient.documentsCount }}</dd>
        </div>
        <div v-if="clientsStore.currentClient.lastActivity">
          <dt>Dernière activité</dt>
          <dd>{{ formatDate(clientsStore.currentClient.lastActivity) }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>
