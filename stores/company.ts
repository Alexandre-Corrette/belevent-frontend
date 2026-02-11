import { defineStore } from 'pinia'
import type { Company, Contact } from '~/types'
import { companyStep2Schema } from '~/validation/company'

/**
 * Store de gestion des entreprises du prestataire.
 * Un prestataire peut avoir plusieurs sociétés.
 */
export const useCompanyStore = defineStore('company', () => {
  const companies = ref<Company[]>([])
  const currentCompany = ref<Company | null>(null)
  const contacts = ref<Contact[]>([])
  const stripeOnboardingUrl = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const isStripeVerified = computed(
    () =>
      currentCompany.value?.stripeChargesEnabled === true &&
      currentCompany.value?.stripePayoutsEnabled === true,
  )

  const companyList = computed(() =>
    [...companies.value].sort((a, b) => a.name.localeCompare(b.name)),
  )

  const contactsByRole = computed(() => {
    const grouped: Record<string, Contact[]> = {
      admin: [],
      commercial: [],
      comptabilite: [],
    }
    for (const contact of contacts.value) {
      if (grouped[contact.role]) {
        grouped[contact.role].push(contact)
      }
    }
    return grouped
  })

  // Actions
  async function fetchCompanies() {
    loading.value = true
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<{ data: Company[] }>('/presta/companies')
      companies.value = data.data

      // Sélectionner la première entreprise si aucune n'est active
      if (!currentCompany.value && companies.value.length > 0) {
        const authStore = useAuthStore()
        const saved = companies.value.find(
          (c) => c.id === authStore.currentCompanyId,
        )
        currentCompany.value = saved ?? companies.value[0]
        authStore.switchCompany(currentCompany.value.id)
      }
    } finally {
      loading.value = false
    }
  }

  async function createCompany(data: {
    siret: string
    companyName: string
    address: string
  }) {
    // Validation Zod avant envoi
    const validated = companyStep2Schema.parse(data)

    const { apiFetch } = useApi()
    const created = await apiFetch<Company>('/companies', {
      method: 'POST',
      body: {
        siret: validated.siret,
        name: validated.companyName,
        address: validated.address,
      },
    })

    companies.value.push(created)
    currentCompany.value = created

    const authStore = useAuthStore()
    authStore.switchCompany(created.id)

    return created
  }

  async function updateCompany(
    id: number,
    data: Partial<Pick<Company, 'address' | 'phone' | 'email' | 'website'>>,
  ) {
    const { apiFetch } = useApi()
    const updated = await apiFetch<Company>(`/presta/companies/${id}`, {
      method: 'PUT',
      body: data,
    })

    const index = companies.value.findIndex((c) => c.id === id)
    if (index !== -1) companies.value[index] = updated
    if (currentCompany.value?.id === id) currentCompany.value = updated

    return updated
  }

  async function switchCompany(id: number) {
    const company = companies.value.find((c) => c.id === id)
    if (!company) return

    currentCompany.value = company

    const authStore = useAuthStore()
    authStore.switchCompany(id)

    // Refetch les données liées à la nouvelle entreprise
    await fetchContacts()
  }

  async function fetchContacts() {
    if (!currentCompany.value) return

    const { apiFetch } = useApi()
    const data = await apiFetch<{ data: Contact[] }>(
      `/presta/companies/${currentCompany.value.id}/contacts`,
    )
    contacts.value = data.data
  }

  async function addContact(data: {
    email: string
    firstName: string
    lastName: string
    role: Contact['role']
    phone?: string
  }) {
    if (!currentCompany.value) return

    const { apiFetch } = useApi()
    const created = await apiFetch<Contact>(
      `/presta/companies/${currentCompany.value.id}/contacts`,
      {
        method: 'POST',
        body: data,
      },
    )

    contacts.value.push(created)
    return created
  }

  async function deleteContact(id: number) {
    const { apiFetch } = useApi()
    await apiFetch(`/presta/contacts/${id}`, { method: 'DELETE' })
    contacts.value = contacts.value.filter((c) => c.id !== id)
  }

  async function initStripeOnboarding() {
    const { apiFetch } = useApi()
    const data = await apiFetch<{ url: string }>('/stripe/connect/onboarding', {
      method: 'POST',
    })
    stripeOnboardingUrl.value = data.url
    return data.url
  }

  async function fetchStripeStatus() {
    if (!currentCompany.value) return

    const { apiFetch } = useApi()
    const data = await apiFetch<Company>(
      `/stripe/connect/status`,
    )

    // Mettre à jour les champs Stripe de la company
    if (currentCompany.value) {
      currentCompany.value.stripeChargesEnabled = data.stripeChargesEnabled
      currentCompany.value.stripePayoutsEnabled = data.stripePayoutsEnabled
      currentCompany.value.stripeOnboardingStatus = data.stripeOnboardingStatus
    }
  }

  function $reset() {
    companies.value = []
    currentCompany.value = null
    contacts.value = []
    stripeOnboardingUrl.value = null
    loading.value = false
  }

  return {
    companies,
    currentCompany,
    contacts,
    stripeOnboardingUrl,
    loading,
    isStripeVerified,
    companyList,
    contactsByRole,
    fetchCompanies,
    createCompany,
    updateCompany,
    switchCompany,
    fetchContacts,
    addContact,
    deleteContact,
    initStripeOnboarding,
    fetchStripeStatus,
    $reset,
  }
})
