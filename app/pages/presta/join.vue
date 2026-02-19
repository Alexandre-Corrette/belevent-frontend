<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()

// --- State ---
const step = ref<'code' | 'confirm'>('code')
const code = ref((route.query.code as string ?? '').toUpperCase())
const category = ref<string | null>(null)
const lookupResult = ref<{
  id: number
  title: string
  category: string
  date: string
  guestCount: number | null
  clientName: string
} | null>(null)

const lookupLoading = ref(false)
const joinLoading = ref(false)
const error = ref('')

const categoryOptions = [
  { value: 'location_salle', label: 'Location de salle' },
  { value: 'traiteur', label: 'Traiteur' },
  { value: 'animation_musique', label: 'Animation / Musique' },
  { value: 'photographe', label: 'Photographe' },
  { value: 'fleuriste', label: 'Fleuriste' },
  { value: 'decoration', label: 'Décoration' },
  { value: 'wedding_planner', label: 'Wedding Planner' },
  { value: 'autre', label: 'Autre' },
]

// Auto-uppercase
watch(code, (val) => {
  const upper = val.toUpperCase()
  if (val !== upper) code.value = upper
})

// Auto-lookup if code from URL
onMounted(() => {
  if (code.value.length === 4) {
    lookup()
  }
})

// --- Step 1: Lookup ---
async function lookup() {
  if (code.value.length !== 4) {
    error.value = 'Le code doit contenir 4 caractères'
    return
  }

  error.value = ''
  lookupLoading.value = true

  try {
    const data = await apiFetch<typeof lookupResult.value>('/presta/events/lookup', {
      params: { code: code.value },
    })
    lookupResult.value = data
    step.value = 'confirm'
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
    if (status === 404) {
      error.value = 'Aucun événement trouvé avec ce code'
    } else if (status === 429) {
      error.value = 'Trop de tentatives, réessayez dans 1 minute'
    } else {
      error.value = 'Impossible de rechercher cet événement'
    }
  } finally {
    lookupLoading.value = false
  }
}

// --- Step 2: Join ---
async function join() {
  if (!category.value) {
    error.value = 'Veuillez sélectionner une catégorie'
    return
  }

  error.value = ''
  joinLoading.value = true

  try {
    const data = await apiFetch<{ eventId: number }>('/presta/events/join', {
      method: 'POST',
      body: {
        inviteCode: code.value,
        category: category.value,
      },
    })
    await router.push(`/presta/events/${data.eventId}`)
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
    if (status === 409) {
      error.value = 'Votre entreprise participe déjà à cet événement'
    } else if (status === 429) {
      error.value = 'Trop de tentatives, réessayez dans 1 minute'
    } else {
      error.value = 'Impossible de rejoindre cet événement'
    }
  } finally {
    joinLoading.value = false
  }
}

function goBack() {
  step.value = 'code'
  lookupResult.value = null
  category.value = null
  error.value = ''
}
</script>

<template>
  <div class="join-event">
    <h1 class="join-event__title">Rejoindre un événement</h1>

    <!-- Step 1: Code -->
    <template v-if="step === 'code'">
      <p class="join-event__subtitle">
        Saisissez le code d'invitation reçu.
      </p>

      <form class="join-event__form" @submit.prevent="lookup">
        <BelInput
          v-model="code"
          label="Code d'invitation"
          placeholder="XXXX"
          :maxlength="4"
        />

        <p v-if="error" class="join-event__error" role="alert">
          {{ error }}
        </p>

        <BelButton
          label="Rechercher"
          type="submit"
          :loading="lookupLoading"
          :disabled="code.length !== 4"
        />
      </form>
    </template>

    <!-- Step 2: Confirm + Category -->
    <template v-else>
      <div class="join-event__event-info">
        <h2 class="join-event__event-title">{{ lookupResult?.title }}</h2>
        <div class="join-event__event-details">
          <span>{{ lookupResult?.category }}</span>
          <span>{{ lookupResult?.date }}</span>
          <span v-if="lookupResult?.guestCount">{{ lookupResult.guestCount }} invités</span>
          <span>Client : {{ lookupResult?.clientName }}</span>
        </div>
      </div>

      <form class="join-event__form" @submit.prevent="join">
        <BelSelect
          v-model="category"
          label="Votre catégorie"
          :options="categoryOptions"
          placeholder="Sélectionnez votre catégorie"
        />

        <p v-if="error" class="join-event__error" role="alert">
          {{ error }}
        </p>

        <div class="join-event__actions">
          <BelButton
            label="Retour"
            variant="ghost"
            @click="goBack"
          />
          <BelButton
            label="Rejoindre cet événement"
            type="submit"
            :loading="joinLoading"
          />
        </div>
      </form>
    </template>
  </div>
</template>
