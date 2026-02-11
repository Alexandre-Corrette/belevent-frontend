import { defineStore } from 'pinia'
import type { User, LoginPayload, RegisterPayload } from '~/types'

/**
 * Store d'authentification.
 *
 * SÉCURITÉ :
 * - Le JWT n'est PAS stocké dans ce store (il est en cookie httpOnly)
 * - Seuls les données utilisateur non-sensibles sont en mémoire
 * - logout() purge tout le state Pinia
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const currentCompanyId = ref<number | null>(null)
  const loading = ref(false)

  // Getters
  const isPresta = computed(() => user.value?.role === 'ROLE_PRESTA')
  const isUser = computed(() => user.value?.role === 'ROLE_USER')
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
  )
  const needsPasswordChange = computed(() => user.value?.isPasswordTemporary ?? false)

  // Actions
  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: payload,
      })
      user.value = data.user
      isAuthenticated.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ user: User }>('/auth/me')
      user.value = data.user
      isAuthenticated.value = true
    } catch {
      isAuthenticated.value = false
      user.value = null
    }
  }

  async function logout() {
    try {
      const { apiFetch } = useApi()
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Logout silencieux même si l'API échoue
    } finally {
      user.value = null
      isAuthenticated.value = false
      currentCompanyId.value = null
    }
  }

  function switchCompany(companyId: number) {
    currentCompanyId.value = companyId
  }

  return {
    user,
    isAuthenticated,
    currentCompanyId,
    loading,
    isPresta,
    isUser,
    fullName,
    needsPasswordChange,
    login,
    fetchMe,
    logout,
    switchCompany,
  }
})
