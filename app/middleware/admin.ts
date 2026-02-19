export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (!auth.isAdmin) {
    return navigateTo('/auth/login')
  }
})
