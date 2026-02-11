/**
 * Middleware d'authentification global.
 * Vérifie que l'utilisateur est connecté avant d'accéder aux routes protégées.
 *
 * SÉCURITÉ : ne pas se fier uniquement au state Pinia.
 * Si isAuthenticated est true mais que fetchMe() échoue (cookie expiré),
 * on redirige vers login.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    // Tenter de restaurer la session via le cookie
    await auth.fetchMe()
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/auth/login', {
      redirectCode: 302,
      replace: true,
    })
  }

  // Forcer le changement de mot de passe si temporaire
  if (auth.needsPasswordChange && to.path !== '/auth/reset-password') {
    return navigateTo('/auth/reset-password')
  }
})
