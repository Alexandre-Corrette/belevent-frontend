import type { Stripe } from '@stripe/stripe-js'

/**
 * Composable for lazy-loading Stripe.js.
 *
 * SECURITY:
 * - Only the public key (pk_*) is used client-side
 * - No card numbers or IBANs transit through BelEvent code
 * - All sensitive payment data is handled by Stripe directly
 */
export const useStripe = () => {
  const config = useRuntimeConfig()
  const stripe = ref<Stripe | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadStripe(): Promise<Stripe | null> {
    if (stripe.value) return stripe.value

    const publicKey = config.public.stripePublicKey
    if (!publicKey || !publicKey.startsWith('pk_')) {
      error.value = 'Stripe public key not configured'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const { loadStripe: loadStripeSdk } = await import('@stripe/stripe-js')
      const instance = await loadStripeSdk(publicKey)
      stripe.value = instance
      return instance
    } catch (e) {
      error.value = 'Failed to load Stripe'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    stripe: readonly(stripe),
    loading: readonly(loading),
    error: readonly(error),
    loadStripe,
  }
}