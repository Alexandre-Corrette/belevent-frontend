<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show: showToast } = useToast()

const eventId = computed(() => Number(route.params.id))

// --- Providers list ---
const providers = ref<{ id: number; companyName: string; category: string }[]>([])
const loadingProviders = ref(true)

const providerOptions = computed(() =>
  providers.value.map((p) => ({
    value: p.id,
    label: `${p.companyName} — ${categoryLabels[p.category] ?? p.category}`,
  })),
)

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

const documentTypeOptions = [
  { value: 'devis', label: 'Devis' },
  { value: 'facture', label: 'Facture' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre', label: 'Autre' },
]

// --- Form state ---
const selectedProvider = ref<number | null>(null)
const documentType = ref<string | null>(null)
const description = ref('')
const dueDate = ref('')
const submitLoading = ref(false)
const error = ref('')

async function fetchProviders() {
  loadingProviders.value = true
  try {
    const data = await apiFetch<{
      providers: { id: number; companyName: string; category: string; status: string }[]
    }>(`/presta/events/${eventId.value}`)
    providers.value = data.providers.filter((p) => p.status === 'confirmed')
  } catch {
    // empty list
  } finally {
    loadingProviders.value = false
  }
}

async function submit() {
  error.value = ''

  if (!selectedProvider.value) {
    error.value = 'Veuillez sélectionner un prestataire'
    return
  }
  if (!documentType.value) {
    error.value = 'Veuillez sélectionner un type de document'
    return
  }

  submitLoading.value = true
  try {
    await apiFetch(`/events/${eventId.value}/document-requests`, {
      method: 'POST',
      body: {
        providerId: selectedProvider.value,
        type: documentType.value,
        description: description.value || undefined,
        dueDate: dueDate.value || undefined,
      },
    })
    showToast('Demande envoyée')
    await router.push(`/presta/events/${eventId.value}`)
  } catch {
    error.value = 'Impossible d\'envoyer la demande'
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchProviders()
})
</script>

<template>
  <div class="document-request">
    <h1 class="document-request__title">Nouvelle demande de document</h1>

    <form class="document-request__form" @submit.prevent="submit">
      <BelSelect
        v-model="selectedProvider"
        label="Prestataire"
        :options="providerOptions"
        placeholder="Sélectionnez un prestataire"
        :disabled="loadingProviders"
      />

      <BelSelect
        v-model="documentType"
        label="Type de document"
        :options="documentTypeOptions"
        placeholder="Sélectionnez un type"
      />

      <div class="document-request__field">
        <label class="document-request__label" for="doc-description">Description</label>
        <textarea
          id="doc-description"
          v-model="description"
          class="document-request__textarea"
          placeholder="Détails de la demande (optionnel)..."
          rows="3"
        />
      </div>

      <BelDatePicker
        v-model="dueDate"
        label="Date limite"
        placeholder="Optionnel"
        :min="new Date().toISOString().split('T')[0]"
      />

      <p v-if="error" class="document-request__error" role="alert">
        {{ error }}
      </p>

      <div class="document-request__actions">
        <BelButton
          label="Annuler"
          variant="ghost"
          @click="router.back()"
        />
        <BelButton
          label="Envoyer la demande"
          type="submit"
          :loading="submitLoading"
        />
      </div>
    </form>

    <BelToast />
  </div>
</template>
