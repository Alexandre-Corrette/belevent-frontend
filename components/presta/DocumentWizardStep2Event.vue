<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { createEventSchema } from '~/validation/presta'
import type { EventCategory, EventLookup } from '~/types'

type Mode = 'existing' | 'code' | 'create'

const emit = defineEmits<{
  submit: [payload: { eventId: number }]
}>()

const eventsStore = useEventsStore()
const { show: showToast } = useToast()

const mode = ref<Mode>('existing')

// --- mode existing ---
const selectedEventId = ref<number | null>(null)
const existingError = ref('')

const eventOptions = computed(() =>
  eventsStore.events.map((e) => ({
    value: e.id,
    label: `${e.title} — ${formatDate(e.date)}`,
  })),
)

// --- mode code ---
const codeInput = ref('')
const lookupResult = ref<EventLookup | null>(null)
const lookupError = ref('')
const lookupLoading = ref(false)

async function doLookup() {
  lookupError.value = ''
  lookupResult.value = null
  const code = codeInput.value.trim().toUpperCase()
  if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) {
    lookupError.value = 'Code invalide (4 caractères alphanumériques, sans 0, 1, I, L, O)'
    return
  }
  lookupLoading.value = true
  const res = await eventsStore.lookupEventByCode(code)
  lookupLoading.value = false
  if (!res) {
    lookupError.value = eventsStore.error ?? 'Aucun événement trouvé'
    return
  }
  lookupResult.value = res
}

// --- mode create ---
const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'seminaire', label: 'Séminaire' },
  { value: 'reception', label: 'Réception' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'communion', label: 'Communion' },
  { value: 'autre', label: 'Autre' },
]

const { handleSubmit: handleCreateSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: toTypedSchema(createEventSchema),
})
const { value: title, errorMessage: titleError } = useField<string>('title')
const { value: category, errorMessage: categoryError } = useField<EventCategory>('category')
const { value: date, errorMessage: dateError } = useField<string>('date')
const { value: guestCount, errorMessage: guestCountError } = useField<number>('guestCount')
const createServerError = ref('')

const submitCreate = handleCreateSubmit(async (values) => {
  createServerError.value = ''
  try {
    const created = await eventsStore.createEvent({
      title: values.title,
      category: values.category,
      date: values.date,
      guestCount: values.guestCount,
    })
    showToast('Événement créé.')
    resetForm()
    emit('submit', { eventId: created.id })
  } catch {
    createServerError.value = eventsStore.error ?? "Impossible de créer l'événement"
  }
})

// --- shared helpers ---
function submitExisting() {
  existingError.value = ''
  if (!selectedEventId.value) {
    existingError.value = 'Veuillez sélectionner un événement'
    return
  }
  emit('submit', { eventId: selectedEventId.value })
}

function confirmLookup() {
  if (lookupResult.value) {
    emit('submit', { eventId: lookupResult.value.id })
  }
}

function formatDate(d: string): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  if (eventsStore.events.length === 0) eventsStore.fetchEvents()
})
</script>

<template>
  <div class="presta-document-wizard__step">
    <h2 class="presta-document-wizard__step-title">Étape 2 — Associer un événement</h2>
    <p class="presta-document-wizard__step-desc">
      Choisissez un événement existant, recherchez-le par code ou créez-en un nouveau.
    </p>

    <div class="presta-document-wizard__mode-picker" role="radiogroup">
      <label><input v-model="mode" type="radio" value="existing" /> Existant</label>
      <label><input v-model="mode" type="radio" value="code" /> Par code</label>
      <label><input v-model="mode" type="radio" value="create" /> Créer</label>
    </div>

    <!-- Mode existing -->
    <div v-if="mode === 'existing'" class="presta-document-wizard__form">
      <BelSelect
        v-model="selectedEventId"
        label="Événement"
        :options="eventOptions"
        searchable
        placeholder="Chercher un événement…"
        :error="existingError"
      />
      <div class="presta-document-wizard__step-actions">
        <BelButton label="Valider l'événement" variant="primary" @click="submitExisting" />
      </div>
    </div>

    <!-- Mode code -->
    <div v-else-if="mode === 'code'" class="presta-document-wizard__form">
      <BelInput
        v-model="codeInput"
        label="Code d'invitation"
        placeholder="Ex. AB2C"
        :maxlength="4"
        :error="lookupError"
      />

      <div v-if="lookupResult" class="presta-document-wizard__lookup-card">
        <div><strong>{{ lookupResult.title }}</strong></div>
        <div>{{ formatDate(lookupResult.date) }}</div>
        <div>Client : {{ lookupResult.clientName }}</div>
        <div v-if="lookupResult.guestCount !== null">
          {{ lookupResult.guestCount }} invités
        </div>
      </div>

      <div class="presta-document-wizard__step-actions">
        <BelButton
          v-if="!lookupResult"
          label="Rechercher"
          variant="primary"
          :loading="lookupLoading"
          @click="doLookup"
        />
        <BelButton
          v-else
          label="Confirmer cet événement"
          variant="primary"
          @click="confirmLookup"
        />
      </div>
    </div>

    <!-- Mode create -->
    <form v-else class="presta-document-wizard__form" @submit.prevent="submitCreate">
      <BelInput v-model="title" label="Titre" :error="titleError" required />
      <BelSelect
        v-model="category"
        label="Catégorie"
        :options="CATEGORY_OPTIONS"
        :error="categoryError"
        placeholder="Sélectionner…"
      />
      <BelInput v-model="date" label="Date (AAAA-MM-JJ)" placeholder="2026-06-15" :error="dateError" />
      <BelInput
        v-model.number="guestCount"
        label="Nombre d'invités"
        type="number"
        :error="guestCountError"
      />

      <p v-if="createServerError" class="presta-document-wizard__error" role="alert">
        {{ createServerError }}
      </p>

      <div class="presta-document-wizard__step-actions">
        <BelButton type="submit" label="Créer l'événement" variant="primary" :loading="isSubmitting" />
      </div>
    </form>
  </div>
</template>
