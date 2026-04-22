import { defineStore } from 'pinia'
import type { DashboardStats, AgendaItem } from '~/types'

/**
 * Store pour les données agrégées du dashboard prestataire.
 *
 * SÉCURITÉ :
 * - Données financières jamais cachées côté client (pas de localStorage)
 * - fetchDashboard appelé à chaque changement de company
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const agenda = ref<AgendaItem[]>([])
  const loading = ref(false)

  // --- Helpers ---

  const euroFormat = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  function formatEuro(amount: number): string {
    return euroFormat.format(amount)
  }

  // --- Getters ---

  const revenueFormatted = computed(() =>
    stats.value ? formatEuro(stats.value.revenueMonth) : '0 €',
  )

  const revenueGoalFormatted = computed(() =>
    stats.value ? formatEuro(stats.value.revenueGoal) : '0 €',
  )

  const quotesSignedFormatted = computed(() =>
    stats.value ? formatEuro(stats.value.quotesSignedAmount) : '0 €',
  )

  const invoicesPendingFormatted = computed(() =>
    stats.value ? formatEuro(stats.value.invoicesPendingAmount) : '0 €',
  )

  const pendingAgendaItems = computed(() =>
    agenda.value.filter((item) => !item.completed),
  )

  // --- Actions ---

  async function fetchDashboard() {
    loading.value = true
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<DashboardStats>('/presta/dashboard')
      stats.value = data
    } catch {
      stats.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchAgenda(date?: string) {
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ data: AgendaItem[] }>('/presta/agenda', {
        params: date ? { date } : undefined,
      })
      agenda.value = data.data
    } catch {
      agenda.value = []
    }
  }

  async function toggleAgendaItem(id: number) {
    const item = agenda.value.find((a) => a.id === id)
    if (!item) return

    try {
      const { apiFetch } = useApi()
      await apiFetch(`/presta/agenda/${id}`, {
        method: 'PUT',
        body: { completed: !item.completed },
      })
      item.completed = !item.completed
    } catch {
      // Silencieux — l'état reste inchangé
    }
  }

  function $reset() {
    stats.value = null
    agenda.value = []
    loading.value = false
  }

  return {
    stats,
    agenda,
    loading,
    revenueFormatted,
    revenueGoalFormatted,
    quotesSignedFormatted,
    invoicesPendingFormatted,
    pendingAgendaItems,
    formatEuro,
    fetchDashboard,
    fetchAgenda,
    toggleAgendaItem,
    $reset,
  }
})
