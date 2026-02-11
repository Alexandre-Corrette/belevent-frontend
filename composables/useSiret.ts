import type { SireneResult } from '~/types'

/**
 * Composable for SIRET auto-completion via the backend.
 *
 * SECURITY:
 * - Calls go through the backend (not directly to the SIRENE API)
 * - Client-side format validation before API call
 * - Results are read-only pre-fill, editable by the user
 */
export const useSiret = () => {
  const { apiFetch } = useApi()

  const result = ref<SireneResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function isValidSiret(siret: string): boolean {
    return /^\d{14}$/.test(siret.replace(/\s/g, ''))
  }

  const debouncedSearch = useDebounceFn(async (siret: string) => {
    const cleaned = siret.replace(/\s/g, '')

    if (!isValidSiret(cleaned)) {
      error.value = 'Le SIRET doit contenir 14 chiffres'
      result.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await apiFetch<SireneResult>(`/sirene/search`, {
        params: { siret: cleaned },
      })
      result.value = data
    } catch {
      error.value = 'Impossible de trouver cette entreprise'
      result.value = null
    } finally {
      loading.value = false
    }
  }, 500)

  function searchSiret(siret: string) {
    debouncedSearch(siret)
  }

  function reset() {
    result.value = null
    loading.value = false
    error.value = null
  }

  return {
    result: readonly(result),
    loading: readonly(loading),
    error: readonly(error),
    searchSiret,
    reset,
  }
}