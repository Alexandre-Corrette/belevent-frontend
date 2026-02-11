/**
 * Stripe plugin — client-side only.
 * Stripe.js is loaded lazily via the useStripe composable.
 */
export default defineNuxtPlugin(() => {
  // The composable is auto-imported by Nuxt.
  // Stripe.js is loaded on-demand, not at page load.
})