<script setup lang="ts">
import type { EventCategory, EventStatus, DocumentStatus, DocumentType, PrestaDocument } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

type TabKey = 'documents' | 'contrats' | 'prestataires'

const route = useRoute()
const router = useRouter()
const { show: showToast } = useToast()

const eventsStore = useEventsStore()
const documentsStore = useDocumentsStore()
const companyStore = useCompanyStore()
const authStore = useAuthStore()

const eventId = computed(() => Number(route.params.id))

const isPrestaPlus = computed(() => companyStore.currentCompany?.plan === 'presta+')

const isOwner = computed(
  () =>
    !!eventsStore.currentEvent &&
    !!authStore.user &&
    eventsStore.currentEvent.createdBy === authStore.user.id,
)

const documentsForEvent = computed(() =>
  documentsStore.documents.filter((d) => d.eventId === eventId.value),
)
const eventDevisFactures = computed(() =>
  documentsForEvent.value.filter((d) => d.type !== 'contrat'),
)
const eventContracts = computed(() =>
  documentsForEvent.value.filter((d) => d.type === 'contrat'),
)

const tabs = computed<{ key: TabKey; label: string; badge: number }[]>(() => {
  const base: { key: TabKey; label: string; badge: number }[] = [
    { key: 'documents', label: 'Documents', badge: eventDevisFactures.value.length },
    { key: 'contrats', label: 'Contrats', badge: eventContracts.value.length },
  ]
  if (isPrestaPlus.value) {
    base.push({
      key: 'prestataires',
      label: 'Prestataires',
      badge: eventsStore.eventProviders.length,
    })
  }
  return base
})

const activeTab = computed<TabKey>({
  get: () => {
    const q = route.query.tab as TabKey | undefined
    if (q && tabs.value.some((t) => t.key === q)) return q
    return 'documents'
  },
  set: (val) => {
    router.replace({ query: { ...route.query, tab: val } })
    selectedDocumentId.value = null
  },
})

const selectedDocumentId = ref<number | null>(null)
const selectedDocument = computed<PrestaDocument | null>(() => {
  if (selectedDocumentId.value === null) return null
  return documentsForEvent.value.find((d) => d.id === selectedDocumentId.value) ?? null
})

const deleteModal = ref<{ open: boolean; documentId: number | null }>({ open: false, documentId: null })
const invoiceModal = ref<{ open: boolean; documentId: number | null }>({ open: false, documentId: null })

const CATEGORY_LABELS: Record<EventCategory, string> = {
  mariage: 'Mariage',
  seminaire: 'Séminaire',
  reception: 'Réception',
  anniversaire: 'Anniversaire',
  communion: 'Communion',
  autre: 'Autre',
}

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  inquiry: 'Demande',
  quoted: 'Devis envoyé',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
}

const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  refused: 'Refusé',
  paid: 'Payé',
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  devis: 'Devis',
  facture: 'Facture',
  contrat: 'Contrat',
}

const PROVIDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  declined: 'Refusé',
}

function formatDate(date?: string): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatAmount(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

async function loadAll() {
  if (!Number.isFinite(eventId.value)) return
  await Promise.all([
    eventsStore.fetchEvent(eventId.value),
    documentsStore.fetchDocuments({ eventId: eventId.value }),
    isPrestaPlus.value ? eventsStore.fetchEventProviders(eventId.value) : Promise.resolve(),
  ])
}

onMounted(loadAll)

watch(eventId, loadAll)

// --- Actions ---

function onEditEvent() {
  showToast("Édition d'événement à venir.")
}

function onEditDocument(id: number) {
  showToast('Édition de document à venir.')
  void id
}

async function onSendDocument(id: number) {
  const updated = await documentsStore.sendDocument(id)
  if (updated) showToast('Document envoyé.')
  else showToast(documentsStore.error ?? 'Échec de l\'envoi', 'error')
}

function askDelete(id: number) {
  deleteModal.value = { open: true, documentId: id }
}

async function confirmDelete() {
  if (deleteModal.value.documentId === null) return
  const id = deleteModal.value.documentId
  await documentsStore.deleteDocument(id)
  if (documentsStore.error) {
    showToast(documentsStore.error, 'error')
  } else {
    showToast('Document supprimé.')
    if (selectedDocumentId.value === id) selectedDocumentId.value = null
  }
  deleteModal.value = { open: false, documentId: null }
}

function askConvertToInvoice(id: number) {
  invoiceModal.value = { open: true, documentId: id }
}

function confirmConvertToInvoice() {
  // Backend endpoint non encore disponible : le flow sera branché lors de l'ajout de la méthode store.
  showToast('Conversion en facture à venir.')
  invoiceModal.value = { open: false, documentId: null }
}

async function onApproveProvider(providerId: number) {
  try {
    await eventsStore.approveProvider(eventId.value, providerId)
    showToast('Prestataire approuvé.')
  } catch {
    showToast(eventsStore.error ?? 'Échec de l\'approbation', 'error')
  }
}

async function onRejectProvider(providerId: number) {
  try {
    await eventsStore.rejectProvider(eventId.value, providerId)
    showToast('Prestataire refusé.')
  } catch {
    showToast(eventsStore.error ?? 'Échec du refus', 'error')
  }
}
</script>

<template>
  <div class="event-detail">
    <!-- Loading / empty state -->
    <template v-if="eventsStore.loading && !eventsStore.currentEvent">
      <p class="event-detail__loading">Chargement…</p>
    </template>

    <template v-else-if="!eventsStore.currentEvent">
      <BelEmptyState
        icon="🔎"
        message="Événement introuvable."
        action-label="Retour à la liste"
        @action="navigateTo('/presta/events')"
      />
    </template>

    <template v-else>
      <!-- Header -->
      <div class="event-detail__header">
        <NuxtLink to="/presta/events" class="event-detail__back">← Retour</NuxtLink>
        <div class="event-detail__title-row">
          <h1 class="event-detail__title">{{ eventsStore.currentEvent.title }}</h1>
          <span
            :class="[
              'event-detail__status',
              `event-detail__status--${eventsStore.currentEvent.status}`,
            ]"
          >
            {{ EVENT_STATUS_LABELS[eventsStore.currentEvent.status] }}
          </span>
        </div>
        <div class="event-detail__actions">
          <BelButton label="Modifier" variant="outline" @click="onEditEvent" />
        </div>
      </div>

      <!-- Info panel -->
      <div class="event-detail__info">
        <div class="event-detail__info-grid">
          <div class="event-detail__info-item">
            <span class="event-detail__info-label">Type</span>
            <span class="event-detail__info-value">
              {{ CATEGORY_LABELS[eventsStore.currentEvent.category] }}
            </span>
          </div>
          <div class="event-detail__info-item">
            <span class="event-detail__info-label">Date</span>
            <span class="event-detail__info-value">{{ formatDate(eventsStore.currentEvent.date) }}</span>
          </div>
          <div class="event-detail__info-item">
            <span class="event-detail__info-label">Client</span>
            <span class="event-detail__info-value">{{ eventsStore.currentEvent.clientName }}</span>
          </div>
          <div class="event-detail__info-item">
            <span class="event-detail__info-label">Invités</span>
            <span class="event-detail__info-value">{{ eventsStore.currentEvent.guestCount ?? '—' }}</span>
          </div>
          <div v-if="eventsStore.currentEvent.budget !== undefined" class="event-detail__info-item">
            <span class="event-detail__info-label">Budget</span>
            <span class="event-detail__info-value">{{ formatAmount(eventsStore.currentEvent.budget) }}</span>
          </div>
        </div>

        <div
          v-if="isOwner && eventsStore.currentEvent.inviteCode"
          class="event-detail__invite"
        >
          <InviteCodeDisplay :code="eventsStore.currentEvent.inviteCode" :event-id="eventsStore.currentEvent.id" />
        </div>
      </div>

      <!-- Tabs -->
      <BelTabs v-model="activeTab" :tabs="tabs" />

      <!-- DOCUMENTS tab -->
      <div v-if="activeTab === 'documents'" class="event-detail__tab">
        <BelEmptyState
          v-if="eventDevisFactures.length === 0 && !documentsStore.loading"
          icon="📄"
          message="Aucun devis ni facture pour cet événement."
          action-label="Créer un document"
          @action="navigateTo('/presta/documents/new')"
        />

        <BelMasterDetail
          v-else
          :show-detail="!!selectedDocument"
          @back="selectedDocumentId = null"
        >
          <template #master>
            <ul class="event-detail__doc-list">
              <li
                v-for="doc in eventDevisFactures"
                :key="doc.id"
                :class="[
                  'event-detail__doc-row',
                  { 'event-detail__doc-row--active': selectedDocumentId === doc.id },
                ]"
                @click="selectedDocumentId = doc.id"
              >
                <span class="event-detail__doc-number">{{ doc.documentNumber }}</span>
                <span class="event-detail__doc-designation">{{ doc.designation }}</span>
                <span class="event-detail__doc-amount">{{ formatAmount(doc.amount) }}</span>
                <span
                  :class="[
                    'event-detail__doc-status',
                    `event-detail__doc-status--${doc.status}`,
                  ]"
                >
                  {{ DOC_STATUS_LABELS[doc.status] }}
                </span>
              </li>
            </ul>
          </template>

          <template #detail>
            <template v-if="selectedDocument">
              <header class="event-detail__doc-detail-header">
                <h2 class="event-detail__doc-detail-title">
                  {{ DOC_TYPE_LABELS[selectedDocument.type] }} {{ selectedDocument.documentNumber }}
                </h2>
                <span
                  :class="[
                    'event-detail__doc-status',
                    `event-detail__doc-status--${selectedDocument.status}`,
                  ]"
                >
                  {{ DOC_STATUS_LABELS[selectedDocument.status] }}
                </span>
              </header>

              <dl class="event-detail__doc-meta">
                <div>
                  <dt>Prestation</dt>
                  <dd>{{ selectedDocument.designation }}</dd>
                </div>
                <div>
                  <dt>Montant</dt>
                  <dd>{{ formatAmount(selectedDocument.amount) }}</dd>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>{{ selectedDocument.clientName }}</dd>
                </div>
                <div v-if="selectedDocument.sentAt">
                  <dt>Envoyé le</dt>
                  <dd>{{ formatDate(selectedDocument.sentAt) }}</dd>
                </div>
                <div v-if="selectedDocument.paidAt">
                  <dt>Payé le</dt>
                  <dd>{{ formatDate(selectedDocument.paidAt) }}</dd>
                </div>
              </dl>

              <div class="event-detail__doc-actions">
                <BelButton label="Modifier" variant="outline" @click="onEditDocument(selectedDocument.id)" />
                <BelButton
                  v-if="selectedDocument.status === 'draft'"
                  label="Envoyer"
                  variant="primary"
                  @click="onSendDocument(selectedDocument.id)"
                />
                <BelButton
                  v-if="selectedDocument.type === 'devis' && selectedDocument.status === 'accepted'"
                  label="Convertir en facture"
                  variant="primary"
                  @click="askConvertToInvoice(selectedDocument.id)"
                />
                <BelButton label="Supprimer" variant="danger" @click="askDelete(selectedDocument.id)" />
              </div>
            </template>
          </template>
        </BelMasterDetail>
      </div>

      <!-- CONTRATS tab -->
      <div v-else-if="activeTab === 'contrats'" class="event-detail__tab">
        <BelEmptyState
          v-if="eventContracts.length === 0"
          icon="📑"
          message="Aucun contrat pour cet événement."
        />
        <ul v-else class="event-detail__doc-list">
          <li v-for="doc in eventContracts" :key="doc.id" class="event-detail__doc-row">
            <span class="event-detail__doc-number">{{ doc.documentNumber }}</span>
            <span class="event-detail__doc-designation">{{ doc.designation }}</span>
            <span class="event-detail__doc-amount">{{ formatAmount(doc.amount) }}</span>
            <span
              :class="[
                'event-detail__doc-status',
                `event-detail__doc-status--${doc.status}`,
              ]"
            >
              {{ DOC_STATUS_LABELS[doc.status] }}
            </span>
          </li>
        </ul>
      </div>

      <!-- PRESTATAIRES tab (presta+ only) -->
      <div
        v-else-if="activeTab === 'prestataires' && isPrestaPlus"
        class="event-detail__tab"
      >
        <BelEmptyState
          v-if="eventsStore.eventProviders.length === 0"
          icon="🤝"
          message="Aucun prestataire rattaché à cet événement."
        />
        <ul v-else class="event-detail__provider-list">
          <li
            v-for="provider in eventsStore.eventProviders"
            :key="provider.id"
            class="event-detail__provider-row"
          >
            <div class="event-detail__provider-info">
              <span class="event-detail__provider-name">{{ provider.company.name }}</span>
              <span class="event-detail__provider-category">{{ provider.category }}</span>
            </div>
            <span
              :class="[
                'event-detail__provider-status',
                `event-detail__provider-status--${provider.status}`,
              ]"
            >
              {{ PROVIDER_STATUS_LABELS[provider.status] ?? provider.status }}
            </span>
            <div v-if="provider.status === 'pending'" class="event-detail__provider-actions">
              <BelButton label="Approuver" variant="primary" size="sm" @click="onApproveProvider(provider.id)" />
              <BelButton label="Refuser" variant="danger" size="sm" @click="onRejectProvider(provider.id)" />
            </div>
          </li>
        </ul>
      </div>

      <!-- Modals -->
      <BelModal v-model="deleteModal.open" title="Supprimer ce document ?">
        <p>Cette action est irréversible. Le document sera définitivement supprimé.</p>
        <template #footer>
          <BelButton label="Annuler" variant="outline" @click="deleteModal.open = false" />
          <BelButton label="Supprimer" variant="danger" @click="confirmDelete" />
        </template>
      </BelModal>

      <BelModal v-model="invoiceModal.open" title="Convertir en facture ?">
        <p>Une facture sera générée à partir de ce devis accepté. Confirmer ?</p>
        <template #footer>
          <BelButton label="Annuler" variant="outline" @click="invoiceModal.open = false" />
          <BelButton label="Convertir" variant="primary" @click="confirmConvertToInvoice" />
        </template>
      </BelModal>
    </template>
  </div>
</template>
