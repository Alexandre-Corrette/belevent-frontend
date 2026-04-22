import { defineStore } from 'pinia'
import type { PrestaClient } from '~/types'
import { inviteClientSchema } from '~/validation/presta'
import type { InviteClientFormData } from '~/validation/presta'

/**
 * Store de gestion des clients du prestataire.
 *
 * SÉCURITÉ :
 * - inviteClient est rate-limité côté client (10/min)
 * - Email validé via Zod avant envoi
 */
export const useClientsStore = defineStore('clients', () => {
  const clients = ref<PrestaClient[]>([])
  const currentClient = ref<PrestaClient | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Rate limit (10 invitations/min)
  const inviteCalls: number[] = []
  const INVITE_RATE_MAX = 10
  const INVITE_RATE_WINDOW = 60_000

  function checkInviteRateLimit(): boolean {
    const now = Date.now()
    while (inviteCalls.length > 0 && inviteCalls[0] < now - INVITE_RATE_WINDOW) {
      inviteCalls.shift()
    }
    if (inviteCalls.length >= INVITE_RATE_MAX) return false
    inviteCalls.push(now)
    return true
  }

  // --- Getters ---

  const clientsByName = computed(() =>
    [...clients.value].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
    ),
  )

  const clientsWithPendingDocs = computed(() =>
    clients.value.filter((c) => c.documentsCount > 0),
  )

  const clientCount = computed(() => clients.value.length)

  // --- Actions ---

  async function fetchClients() {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ data: PrestaClient[] }>('/presta/clients')
      clients.value = data.data
    } catch {
      error.value = 'Impossible de charger les clients'
    } finally {
      loading.value = false
    }
  }

  async function fetchClient(id: number) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<PrestaClient>(`/presta/clients/${id}`)
      currentClient.value = data
      return data
    } catch {
      error.value = 'Impossible de charger le client'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Invite un client. Retourne le statut HTTP pour distinguer :
   * - 201 : nouveau client créé
   * - 200 : client existant, associé à l'event
   */
  async function inviteClient(data: InviteClientFormData): Promise<{ status: number; client: PrestaClient } | null> {
    if (!checkInviteRateLimit()) {
      error.value = 'Trop d\'invitations envoyées, veuillez patienter'
      return null
    }

    // Validation Zod avant envoi
    inviteClientSchema.parse(data)

    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const response = await apiFetch<PrestaClient>('/presta/invite', {
        method: 'POST',
        body: data,
      })

      // Ajouter ou mettre à jour le client dans la liste
      const existing = clients.value.findIndex((c) => c.id === response.id)
      if (existing !== -1) {
        clients.value[existing] = response
        return { status: 200, client: response }
      }
      clients.value.push(response)
      return { status: 201, client: response }
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null
      if (status === 409) {
        error.value = 'Ce client est déjà associé à cet événement'
      } else if (status === 422) {
        error.value = 'Données d\'invitation invalides'
      } else {
        error.value = 'Impossible d\'inviter le client'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function searchClients(query: string) {
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ data: PrestaClient[] }>('/presta/clients', {
        params: { search: query },
      })
      return data.data
    } catch {
      return []
    }
  }

  function $reset() {
    clients.value = []
    currentClient.value = null
    loading.value = false
    error.value = null
  }

  return {
    clients,
    currentClient,
    loading,
    error,
    clientsByName,
    clientsWithPendingDocs,
    clientCount,
    fetchClients,
    fetchClient,
    inviteClient,
    searchClients,
    $reset,
  }
})
