/**
 * Composable de timeout d'inactivité.
 *
 * Déconnecte l'utilisateur après un délai configurable d'inactivité.
 * L'inactivité est définie par l'absence de clics, frappes clavier ou scroll.
 *
 * SÉCURITÉ :
 * - Le logout purge complètement le store Pinia + cookies serveur
 * - Le widget est exclu (pas d'auth JWT)
 * - Un avertissement s'affiche 60s avant la déconnexion
 */

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE = 60 * 1000 // 60 secondes avant déconnexion
const MOUSEMOVE_DEBOUNCE = 5000 // Debounce mousemove à 5s

export const useInactivityTimeout = () => {
  const authStore = useAuthStore()
  const route = useRoute()

  const showWarning = ref(false)
  const secondsLeft = ref(60)

  let inactivityTimer: ReturnType<typeof setTimeout> | null = null
  let warningTimer: ReturnType<typeof setTimeout> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let lastMouseMove = 0

  function isWidgetRoute(): boolean {
    return route.path.startsWith('/widget')
  }

  function resetTimers() {
    if (isWidgetRoute() || !authStore.isAuthenticated) return

    // Clear existing timers
    if (inactivityTimer) clearTimeout(inactivityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    if (countdownInterval) clearInterval(countdownInterval)

    showWarning.value = false
    secondsLeft.value = 60

    // Warning timer: fires INACTIVITY_TIMEOUT - WARNING_BEFORE
    warningTimer = setTimeout(() => {
      showWarning.value = true
      secondsLeft.value = WARNING_BEFORE / 1000

      countdownInterval = setInterval(() => {
        secondsLeft.value--
        if (secondsLeft.value <= 0 && countdownInterval) {
          clearInterval(countdownInterval)
        }
      }, 1000)
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

    // Logout timer: fires at INACTIVITY_TIMEOUT
    inactivityTimer = setTimeout(async () => {
      await performLogout()
    }, INACTIVITY_TIMEOUT)
  }

  async function performLogout() {
    cleanup()
    await authStore.logout()
    await navigateTo('/auth/login', { replace: true })
  }

  async function continueSession() {
    showWarning.value = false
    resetTimers()

    // Refresh token silencieux
    try {
      await authStore.refreshToken()
    } catch {
      // Si le refresh échoue, on continue quand même avec le timer reset
    }
  }

  function handleActivity() {
    if (showWarning.value) return // Don't reset if warning is showing
    resetTimers()
  }

  function handleMouseMove() {
    const now = Date.now()
    if (now - lastMouseMove < MOUSEMOVE_DEBOUNCE) return
    lastMouseMove = now
    handleActivity()
  }

  function cleanup() {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    if (countdownInterval) clearInterval(countdownInterval)

    if (import.meta.client) {
      document.removeEventListener('click', handleActivity)
      document.removeEventListener('keydown', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }

  function init() {
    if (!import.meta.client) return
    if (isWidgetRoute()) return

    document.addEventListener('click', handleActivity)
    document.addEventListener('keydown', handleActivity)
    document.addEventListener('scroll', handleActivity)
    document.addEventListener('mousemove', handleMouseMove)

    resetTimers()
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    showWarning: readonly(showWarning),
    secondsLeft: readonly(secondsLeft),
    continueSession,
  }
}
