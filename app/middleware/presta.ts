/**
 * Middleware spécifique aux routes /presta/*.
 * Vérifie le rôle ROLE_PRESTA + que la company est active.
 */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()

  if (!auth.isPresta) {
    return navigateTo('/auth/login', { replace: true })
  }
})
