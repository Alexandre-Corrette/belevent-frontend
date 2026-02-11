/**
 * Middleware pour la page de première connexion (first-login).
 * Vérifie la présence et la validité du token d'invitation dans les query params.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const token = to.query.token as string | undefined

  if (!token) {
    return navigateTo('/auth/login', { replace: true })
  }

  const auth = useAuthStore()

  try {
    await auth.verifyInvitationToken(token)
  } catch {
    return navigateTo('/auth/login', {
      replace: true,
      query: { error: 'token_invalid' },
    })
  }
})
