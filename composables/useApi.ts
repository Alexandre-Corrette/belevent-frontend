/**
 * Composable central pour les appels API.
 *
 * SÉCURITÉ :
 * - Le JWT est en cookie httpOnly (géré automatiquement par le navigateur)
 * - Pas de token dans le code JS / headers manuels
 * - Intercepteur pour refresh token sur 401
 * - Timeout de 30s par défaut
 */
export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const apiFetch = $fetch.create({
    baseURL,
    credentials: 'include', // Envoie les cookies httpOnly automatiquement
    timeout: 30_000,

    onRequest({ options }) {
      // Les cookies sont envoyés automatiquement grâce à credentials: 'include'
      // Pas besoin d'ajouter de header Authorization manuellement
    },

    async onResponseError({ response }) {
      if (response.status === 401) {
        // Tenter un refresh
        try {
          await $fetch(`${baseURL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          })
          // Le cookie a été renouvelé, retry automatiquement
        } catch {
          // Refresh échoué → déconnexion
          const auth = useAuthStore()
          auth.logout()
          await navigateTo('/auth/login')
        }
      }
    },
  })

  return { apiFetch, baseURL }
}
