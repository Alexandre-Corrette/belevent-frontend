<script setup lang="ts">
import type { Company } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()

const eventId = computed(() => Number(route.params.id))

// --- Company search ---
const searchQuery = ref('')
const searchLoading = ref(false)
const companies = ref<Company[]>([])
const selectedCompany = ref<Company | null>(null)

// --- Form state ---
const category = ref<string | null>(null)
const notes = ref('')
const submitLoading = ref(false)
const error = ref('')

const categoryOptions = [
  { value: 'location_salle', label: 'Salle / Lieu' },
  { value: 'traiteur', label: 'Traiteur' },
  { value: 'animation_musique', label: 'Animation / Musique' },
  { value: 'photographe', label: 'Photographe' },
  { value: 'fleuriste', label: 'Fleuriste' },
  { value: 'decoration', label: 'Décoration' },
  { value: 'wedding_planner', label: 'Wedding Planner' },
  { value: 'autre', label: 'Autre' },
]

async function onSearch(query: string) {
  if (query.length < 2) {
    companies.value = []
    return
  }

  searchLoading.value = true
  try {
    const data = await apiFetch<{ data: Company[] }>('/companies', {
      params: { search: query },
    })
    companies.value = data.data
  } catch {
    companies.value = []
  } finally {
    searchLoading.value = false
  }
}

function selectCompany(company: Company) {
  selectedCompany.value = company
  searchQuery.value = company.name
  companies.value = []
}

function clearSelection() {
  selectedCompany.value = null
  searchQuery.value = ''
  companies.value = []
}

async function submit() {
  error.value = ''

  if (!selectedCompany.value) {
    error.value = 'Veuillez sélectionner une entreprise'
    return
  }
  if (!category.value) {
    error.value = 'Veuillez sélectionner une catégorie'
    return
  }

  submitLoading.value = true
  try {
    await apiFetch(`/presta/events/${eventId.value}/providers`, {
      method: 'POST',
      body: {
        companyId: selectedCompany.value.id,
        category: category.value,
        notes: notes.value || undefined,
      },
    })
    await router.push(`/presta/events/${eventId.value}`)
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
    if (status === 409) {
      error.value = 'Cette entreprise est déjà prestataire de cet événement'
    } else {
      error.value = 'Impossible d\'ajouter ce prestataire'
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="new-provider">
    <h1 class="new-provider__title">Ajouter un prestataire</h1>

    <form class="new-provider__form" @submit.prevent="submit">
      <!-- Company search -->
      <div class="new-provider__field">
        <label class="new-provider__label">Entreprise</label>

        <template v-if="selectedCompany">
          <div class="new-provider__selected">
            <span>{{ selectedCompany.name }}</span>
            <button type="button" class="new-provider__clear" @click="clearSelection">
              &times;
            </button>
          </div>
        </template>

        <template v-else>
          <BelSearchInput
            v-model="searchQuery"
            placeholder="Rechercher une entreprise..."
            :loading="searchLoading"
            @search="onSearch"
          />

          <ul v-if="companies.length > 0" class="new-provider__results">
            <li
              v-for="company in companies"
              :key="company.id"
              class="new-provider__result-item"
              @click="selectCompany(company)"
            >
              <span class="new-provider__result-name">{{ company.name }}</span>
              <span class="new-provider__result-siret">{{ company.siret }}</span>
            </li>
          </ul>

          <p
            v-else-if="searchQuery.length >= 2 && !searchLoading && companies.length === 0"
            class="new-provider__no-result"
          >
            Aucune entreprise trouvée. Utilisez le code invitation pour que le prestataire rejoigne l'événement.
          </p>
        </template>
      </div>

      <!-- Category -->
      <BelSelect
        v-model="category"
        label="Catégorie"
        :options="categoryOptions"
        placeholder="Sélectionnez une catégorie"
      />

      <!-- Notes -->
      <div class="new-provider__field">
        <label class="new-provider__label" for="provider-notes">Notes</label>
        <textarea
          id="provider-notes"
          v-model="notes"
          class="new-provider__textarea"
          placeholder="Notes optionnelles..."
          rows="3"
        />
      </div>

      <p v-if="error" class="new-provider__error" role="alert">
        {{ error }}
      </p>

      <div class="new-provider__actions">
        <BelButton
          label="Annuler"
          variant="ghost"
          @click="router.back()"
        />
        <BelButton
          label="Ajouter le prestataire"
          type="submit"
          :loading="submitLoading"
        />
      </div>
    </form>
  </div>
</template>
