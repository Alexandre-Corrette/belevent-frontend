/**
 * Middleware spécifique aux routes /presta/*.
 * Vérifie le rôle ROLE_PRESTA + que la company est active.
 *
 * SÉCURITÉ : sur les routes documents/paiements, vérifie que
 * Stripe Connect est vérifié. Sinon, redirige vers l'onboarding Stripe.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.isPresta) {
    return navigateTo('/auth/login', { replace: true })
  }
})
