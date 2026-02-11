/**
 * Middleware pour les routes publiques (login, register).
 * Redirige vers le dashboard si déjà connecté.
 */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()

  if (auth.isAuthenticated) {
    if (auth.isPresta) return navigateTo('/presta')
    if (auth.isUser) return navigateTo('/user')
  }
})
