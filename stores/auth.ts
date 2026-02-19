import { defineStore } from 'pinia'
import type { User, LoginPayload, RegisterPayload } from '~/types'

/**
 * Store d'authentification.
 *
 * SÉCURITÉ :
 * - Le JWT n'est PAS stocké dans ce store (il est en cookie httpOnly)
 * - Seuls les données utilisateur non-sensibles sont en mémoire
 * - logout() purge tout le state Pinia
 * - Le refresh token est en cookie httpOnly avec path restreint /api/auth/refresh
 * - Un flag isRefreshing empêche les appels refresh en parallèle
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const currentCompanyId = ref<number | null>(null)
  const loading = ref(false)
  const isPasswordTemporary = ref(false)

  // Getters
  const isPresta = computed(() => user.value?.roles?.includes('ROLE_PRESTA') ?? false)
  const isUser = computed(() => user.value?.roles?.includes('ROLE_USER') ?? false)
  const isAdmin = computed(() => user.value?.roles?.includes('ROLE_ADMIN') ?? false)
  const isClient = computed(() => !isPresta.value && isAuthenticated.value)
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
  )
  const needsPasswordChange = computed(
    () => user.value?.isPasswordTemporary ?? isPasswordTemporary.value,
  )

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
      isPasswordTemporary.value = data.user.isPasswordTemporary
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const { apiFetch } = useApi()
      await apiFetch('/auth/register', {
        method: 'POST',
        body: payload,
      })
      // Auto-login après inscription
      await login({ email: payload.email, password: payload.password })
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
      isPasswordTemporary.value = data.user.isPasswordTemporary
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
      isPasswordTemporary.value = false
    }
  }

  async function refreshToken() {
    const { apiFetch } = useApi()
    await apiFetch('/auth/refresh', { method: 'POST' })
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const { apiFetch } = useApi()
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    })
    isPasswordTemporary.value = false
  }

  async function forgotPassword(email: string) {
    const { apiFetch } = useApi()
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  async function resetPassword(token: string, newPassword: string) {
    const { apiFetch } = useApi()
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    })
  }

  async function verifyInvitationToken(token: string): Promise<{ email: string }> {
    const { apiFetch } = useApi()
    return await apiFetch<{ email: string }>('/auth/verify-token', {
      params: { token },
    })
  }

  function switchCompany(companyId: number) {
    currentCompanyId.value = companyId
  }

  return {
    user,
    isAuthenticated,
    currentCompanyId,
    loading,
    isPasswordTemporary,
    isPresta,
    isUser,
    isAdmin,
    isClient,
    fullName,
    needsPasswordChange,
    login,
    register,
    fetchMe,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyInvitationToken,
    switchCompany,
  }
})