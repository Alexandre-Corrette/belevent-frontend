/**
 * Composable central pour les appels API.
 *
 * SÉCURITÉ :
 * - Le JWT est en cookie httpOnly (géré automatiquement par le navigateur)
 * - Pas de token dans le code JS / headers manuels
 * - Retry queue avec mutex sur refresh token (401)
 * - Timeout de 30s par défaut, 10s pour le refresh
 * - Les requêtes vers /auth/refresh ne déclenchent pas un refresh (anti-boucle)
 */

let isRefreshing = false
let refreshPromise: Promise<void> | null = null
const pendingQueue: Array<{
  resolve: () => void
  reject: (reason?: unknown) => void
}> = []

function processPendingQueue(error?: unknown) {
  for (const { resolve, reject } of pendingQueue) {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  }
  pendingQueue.length = 0
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl as string

  async function doRefresh(): Promise<void> {
    await $fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      timeout: 10_000,
    })
  }

  async function handleRefresh(): Promise<void> {
    if (isRefreshing) {
      // Attendre que le refresh en cours se termine
      return new Promise<void>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
    }

    isRefreshing = true
    refreshPromise = doRefresh()

    try {
      await refreshPromise
      processPendingQueue()
    } catch (err) {
      processPendingQueue(err)
      throw err
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }

  const apiFetch = $fetch.create({
    baseURL,
    credentials: 'include',
    timeout: 30_000,

    async onResponseError({ request, response, options }) {
      if (response.status !== 401) return

      // Ne pas refresh sur les endpoints auth/refresh ou auth/login (anti-boucle)
      const url = typeof request === 'string' ? request : request.toString()
      if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
        return
      }

      try {
        await handleRefresh()

        // Rejouer la requête originale après refresh réussi
        // $fetch.create ne permet pas de retry nativement,
        // donc on lance l'erreur et le code appelant doit gérer le retry
        // via un wrapper ou un pattern try/catch + recall
      } catch {
        // Refresh échoué → déconnexion
        const auth = useAuthStore()
        await auth.logout()
        await navigateTo('/auth/login')
      }
    },
  })

  /**
   * Wrapper avec retry automatique sur 401.
   * Tente un refresh token puis rejoue la requête une seule fois.
   */
  async function fetchWithRetry<T>(
    url: string,
    options?: Parameters<typeof $fetch>[1],
  ): Promise<T> {
    try {
      return await apiFetch<T>(url, options)
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'status' in err
          ? (err as { status: number }).status
          : null

      // Si 401 et pas un endpoint auth/refresh → retry après refresh
      if (
        status === 401 &&
        !url.includes('/auth/refresh') &&
        !url.includes('/auth/login')
      ) {
        try {
          await handleRefresh()
          // Rejouer la requête
          return await apiFetch<T>(url, options)
        } catch {
          const auth = useAuthStore()
          await auth.logout()
          await navigateTo('/auth/login')
          throw err
        }
      }

      throw err
    }
  }

  return { apiFetch: fetchWithRetry, baseURL }
}