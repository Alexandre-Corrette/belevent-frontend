// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  dir: {
    app: 'app',
    pages: 'app/pages',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    plugins: 'app/plugins',
  },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vee-validate/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
      mercureUrl:
        process.env.NUXT_PUBLIC_MERCURE_URL || 'http://localhost:3000/.well-known/mercure',
      stripePublicKey: process.env.NUXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '0.1.0',
    },
  },

  css: ['~/assets/styles/main.scss'],

vite: {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/assets/styles/variables" as *; @use "~/assets/styles/mixins" as *;`
      }
    }
  }
},


  typescript: {
    strict: true,
    typeCheck: 'build',
  },

  // Sécurité : headers par défaut
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
    // Le widget doit pouvoir être embarqué en iframe
    '/widget/**': {
      headers: {
        'X-Frame-Options': 'ALLOWALL',
      },
    },
  },
  
})
