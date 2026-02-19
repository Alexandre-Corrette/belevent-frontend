<script setup lang="ts">
import type { PendingProvider } from '~/types'

interface Props {
  eventId: number
  providers: PendingProvider[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updated: []
}>()

const { apiFetch } = useApi()

const categoryLabels: Record<string, string> = {
  location_salle: 'Salle / Lieu',
  traiteur: 'Traiteur',
  animation_musique: 'Animation / Musique',
  photographe: 'Photographe',
  fleuriste: 'Fleuriste',
  decoration: 'Décoration',
  wedding_planner: 'Wedding Planner',
  autre: 'Autre',
}

const loadingId = ref<number | null>(null)
const showRejectConfirm = ref(false)
const rejectTarget = ref<PendingProvider | null>(null)

const pendingList = computed(() =>
  props.providers.filter((p) => p.status === 'pending'),
)

const pendingCount = computed(() => pendingList.value.length)

function translateCategory(category: string): string {
  return categoryLabels[category] ?? category
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function approve(provider: PendingProvider) {
  loadingId.value = provider.id
  try {
    await apiFetch(`/events/${props.eventId}/providers/${provider.id}/approve`, {
      method: 'PUT',
    })
    emit('updated')
  } catch {
    // silent — parent will refetch
  } finally {
    loadingId.value = null
  }
}

function confirmReject(provider: PendingProvider) {
  rejectTarget.value = provider
  showRejectConfirm.value = true
}

async function reject() {
  if (!rejectTarget.value) return
  const provider = rejectTarget.value
  showRejectConfirm.value = false
  loadingId.value = provider.id
  try {
    await apiFetch(`/events/${props.eventId}/providers/${provider.id}/reject`, {
      method: 'PUT',
    })
    emit('updated')
  } catch {
    // silent
  } finally {
    loadingId.value = null
    rejectTarget.value = null
  }
}
</script>

<template>
  <div class="pending-providers">
    <div class="pending-providers__header">
      <h3 class="pending-providers__title">
        Prestataires en attente
      </h3>
      <BelBadge v-if="pendingCount > 0" :count="pendingCount" variant="warning" />
    </div>

    <TransitionGroup name="pending-provider" tag="div" class="pending-providers__list">
      <div
        v-for="provider in pendingList"
        :key="provider.id"
        class="pending-providers__item"
      >
        <div class="pending-providers__info">
          <span class="pending-providers__company">{{ provider.companyName }}</span>
          <span class="pending-providers__category">{{ translateCategory(provider.category) }}</span>
          <span class="pending-providers__date">{{ formatDate(provider.createdAt) }}</span>
        </div>

        <div class="pending-providers__actions">
          <BelButton
            label="Approuver"
            size="sm"
            :loading="loadingId === provider.id"
            :disabled="loadingId !== null && loadingId !== provider.id"
            @click="approve(provider)"
          />
          <BelButton
            label="Refuser"
            variant="danger"
            size="sm"
            :disabled="loadingId !== null"
            @click="confirmReject(provider)"
          />
        </div>
      </div>
    </TransitionGroup>

    <p v-if="pendingCount === 0" class="pending-providers__empty">
      Aucun prestataire en attente.
    </p>

    <BelModal v-model="showRejectConfirm" title="Refuser ce prestataire ?" size="sm">
      <p>
        Refuser <strong>{{ rejectTarget?.companyName }}</strong> ?
        Cette action est définitive.
      </p>
      <template #footer>
        <BelButton label="Annuler" variant="ghost" @click="showRejectConfirm = false" />
        <BelButton label="Refuser" variant="danger" @click="reject" />
      </template>
    </BelModal>
  </div>
</template>

<style scoped>
.pending-providers__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pending-providers__title {
  margin: 0;
  font-size: 1.1rem;
}

.pending-providers__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pending-providers__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.pending-providers__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pending-providers__company {
  font-weight: 600;
}

.pending-providers__category {
  font-size: 0.85rem;
  color: #6b7280;
}

.pending-providers__date {
  font-size: 0.8rem;
  color: #9ca3af;
}

.pending-providers__actions {
  display: flex;
  gap: 0.5rem;
}

.pending-providers__empty {
  color: #9ca3af;
  font-style: italic;
}

.pending-provider-enter-active,
.pending-provider-leave-active {
  transition: all 0.3s ease;
}

.pending-provider-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
