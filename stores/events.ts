import { defineStore } from 'pinia'
import type {
  PrestaEvent,
  PrestaEventProvider,
  EventLookup,
  EventFilters,
} from '~/types'
import { createEventSchema } from '~/validation/presta'
import type { CreateEventFormData } from '~/validation/presta'

/**
 * Store de gestion des événements du prestataire.
 *
 * SÉCURITÉ :
 * - Utilise useApi() (JWT httpOnly, retry 401)
 * - lookupEventByCode et joinEvent appliquent un rate limit client (5/min)
 * - inviteCode n'est exposé que si l'utilisateur est createdBy (vérification backend voter)
 */
export const useEventsStore = defineStore('events', () => {
  const events = ref<PrestaEvent[]>([])
  const currentEvent = ref<PrestaEvent | null>(null)
  const eventProviders = ref<PrestaEventProvider[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<EventFilters>({})

  // Rate limit tracker (5 appels/min pour lookup/join)
  const rateLimitCalls: number[] = []
  const RATE_LIMIT_MAX = 5
  const RATE_LIMIT_WINDOW = 60_000

  function checkRateLimit(): boolean {
    const now = Date.now()
    // Purge les appels hors fenêtre
    while (rateLimitCalls.length > 0 && rateLimitCalls[0] < now - RATE_LIMIT_WINDOW) {
      rateLimitCalls.shift()
    }
    if (rateLimitCalls.length >= RATE_LIMIT_MAX) return false
    rateLimitCalls.push(now)
    return true
  }

  // --- Getters ---

  const upcomingEvents = computed(() =>
    [...events.value]
      .filter((e) => e.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date)),
  )

  const eventsByMonth = computed(() => (month: string) =>
    events.value.filter((e) => e.date.startsWith(month)),
  )

  const pendingProviders = computed(() =>
    eventProviders.value.filter((ep) => ep.status === 'pending'),
  )

  const confirmedProviders = computed(() =>
    eventProviders.value.filter((ep) => ep.status === 'confirmed'),
  )

  // --- Actions ---

  async function fetchEvents(params?: EventFilters) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const query = params ?? filters.value
      const data = await apiFetch<{ data: PrestaEvent[] }>('/presta/events', {
        params: query,
      })
      events.value = data.data
    } catch (err: unknown) {
      error.value = 'Impossible de charger les événements'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEvent(id: number) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<PrestaEvent>(`/presta/events/${id}`)
      currentEvent.value = data
      return data
    } catch (err: unknown) {
      error.value = 'Impossible de charger l\'événement'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEvent(data: CreateEventFormData) {
    const validated = createEventSchema.parse(data)

    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const created = await apiFetch<PrestaEvent>('/presta/events', {
        method: 'POST',
        body: validated,
      })
      events.value.push(created)
      return created
    } catch (err: unknown) {
      error.value = 'Impossible de créer l\'événement'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id: number, data: Partial<CreateEventFormData>) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const updated = await apiFetch<PrestaEvent>(`/presta/events/${id}`, {
        method: 'PUT',
        body: data,
      })
      const index = events.value.findIndex((e) => e.id === id)
      if (index !== -1) events.value[index] = updated
      if (currentEvent.value?.id === id) currentEvent.value = updated
      return updated
    } catch (err: unknown) {
      error.value = 'Impossible de modifier l\'événement'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEventProviders(eventId: number) {
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ data: PrestaEventProvider[] }>(
        `/presta/events/${eventId}/providers`,
      )
      eventProviders.value = data.data
    } catch (err: unknown) {
      error.value = 'Impossible de charger les prestataires'
      throw err
    }
  }

  async function lookupEventByCode(code: string): Promise<EventLookup | null> {
    if (!checkRateLimit()) {
      error.value = 'Trop de tentatives, veuillez patienter'
      return null
    }

    try {
      const { apiFetch } = useApi()
      return await apiFetch<EventLookup>('/presta/events/lookup', {
        params: { code },
      })
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
      if (status === 404) {
        error.value = 'Aucun événement trouvé avec ce code'
      } else {
        error.value = 'Erreur lors de la recherche'
      }
      return null
    }
  }

  async function joinEvent(inviteCode: string, category: string, notes?: string) {
    if (!checkRateLimit()) {
      error.value = 'Trop de tentatives, veuillez patienter'
      return null
    }

    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const result = await apiFetch<PrestaEventProvider>('/presta/events/join', {
        method: 'POST',
        body: { inviteCode, category, notes },
      })
      return result
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
      if (status === 409) {
        error.value = 'Vous participez déjà à cet événement'
      } else if (status === 429) {
        error.value = 'Trop de tentatives, veuillez patienter'
      } else {
        error.value = 'Impossible de rejoindre l\'événement'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function approveProvider(eventId: number, providerId: number) {
    const { apiFetch } = useApi()
    await apiFetch(`/events/${eventId}/providers/${providerId}/approve`, {
      method: 'PUT',
    })
    const provider = eventProviders.value.find((ep) => ep.id === providerId)
    if (provider) provider.status = 'confirmed'
  }

  async function rejectProvider(eventId: number, providerId: number) {
    const { apiFetch } = useApi()
    await apiFetch(`/events/${eventId}/providers/${providerId}/reject`, {
      method: 'PUT',
    })
    const provider = eventProviders.value.find((ep) => ep.id === providerId)
    if (provider) provider.status = 'declined'
  }

  async function regenerateCode(eventId: number): Promise<string | null> {
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ inviteCode: string }>(
        `/events/${eventId}/regenerate-code`,
        { method: 'POST' },
      )
      if (currentEvent.value?.id === eventId) {
        currentEvent.value.inviteCode = data.inviteCode
      }
      return data.inviteCode
    } catch {
      error.value = 'Impossible de régénérer le code'
      return null
    }
  }

  function setFilters(newFilters: EventFilters) {
    filters.value = newFilters
  }

  function $reset() {
    events.value = []
    currentEvent.value = null
    eventProviders.value = []
    loading.value = false
    error.value = null
    filters.value = {}
  }

  return {
    events,
    currentEvent,
    eventProviders,
    loading,
    error,
    filters,
    upcomingEvents,
    eventsByMonth,
    pendingProviders,
    confirmedProviders,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    fetchEventProviders,
    lookupEventByCode,
    joinEvent,
    approveProvider,
    rejectProvider,
    regenerateCode,
    setFilters,
    $reset,
  }
})
