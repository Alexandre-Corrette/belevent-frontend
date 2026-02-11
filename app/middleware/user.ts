/**
 * Middleware spécifique aux routes /user/*.
 * Vérifie le rôle ROLE_USER.
 */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()

  if (!auth.isUser) {
    return navigateTo('/auth/login', { replace: true })
  }
})
