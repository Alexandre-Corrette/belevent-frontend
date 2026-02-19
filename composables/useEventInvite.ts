import type { EventLookup, EventProvider } from '~/types'

export function useEventInvite() {
  const { apiFetch } = useApi()

  const isLookingUp = ref(false)
  const isJoining = ref(false)
  const lookupResult = ref<EventLookup | null>(null)
  const error = ref<string | null>(null)

  function normalizeCode(code: string): string {
    return code.replace(/^EVT-/i, '').toUpperCase().trim()
  }

  async function lookup(code: string): Promise<void> {
    error.value = null
    lookupResult.value = null
    isLookingUp.value = true

    try {
      const normalized = normalizeCode(code)
      const data = await apiFetch<EventLookup>('/presta/events/lookup', {
        params: { code: normalized },
      })
      lookupResult.value = data
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
      isLookingUp.value = false
    }
  }

  async function join(inviteCode: string, category: string): Promise<EventProvider | null> {
    error.value = null
    isJoining.value = true

    try {
      const data = await apiFetch<EventProvider>('/presta/events/join', {
        method: 'POST',
        body: {
          inviteCode: normalizeCode(inviteCode),
          category,
        },
      })
      return data
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
      return null
    } finally {
      isJoining.value = false
    }
  }

  return {
    isLookingUp: readonly(isLookingUp),
    isJoining: readonly(isJoining),
    lookupResult: readonly(lookupResult),
    error: readonly(error),
    lookup,
    join,
  }
}
