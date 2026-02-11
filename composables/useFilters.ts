/**
 * Composable for filter + pagination state synchronized with URL query params.
 *
 * Usage:
 *   const { filters, page, limit, sortBy, sortDirection, resetFilters } = useFilters({
 *     status: '',
 *     search: '',
 *   })
 */
export const useFilters = <T extends Record<string, string>>(defaultFilters: T) => {
  const route = useRoute()
  const router = useRouter()

  const filters = ref({ ...defaultFilters }) as Ref<T>
  const page = ref(Number(route.query.page) || 1)
  const limit = ref(Number(route.query.limit) || 20)
  const sortBy = ref((route.query.sortBy as string) || '')
  const sortDirection = ref<'asc' | 'desc'>((route.query.sortDirection as 'asc' | 'desc') || 'asc')

  // Initialize filters from query params
  for (const key of Object.keys(defaultFilters)) {
    if (route.query[key]) {
      ;(filters.value as Record<string, string>)[key] = route.query[key] as string
    }
  }

  // Sync filters to URL query params
  function syncToUrl() {
    const query: Record<string, string> = {}

    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) {
        query[key] = String(value)
      }
    }

    if (page.value > 1) query.page = String(page.value)
    if (limit.value !== 20) query.limit = String(limit.value)
    if (sortBy.value) query.sortBy = sortBy.value
    if (sortDirection.value !== 'asc') query.sortDirection = sortDirection.value

    router.replace({ query })
  }

  // Reset page to 1 when filters change
  watch(
    filters,
    () => {
      page.value = 1
      syncToUrl()
    },
    { deep: true },
  )

  watch([page, limit, sortBy, sortDirection], () => {
    syncToUrl()
  })

  function resetFilters() {
    filters.value = { ...defaultFilters } as T
    page.value = 1
    sortBy.value = ''
    sortDirection.value = 'asc'
  }

  return {
    filters,
    page,
    limit,
    sortBy,
    sortDirection,
    resetFilters,
  }
}