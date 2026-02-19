import { defineStore } from 'pinia'
import type { PrestaDocument, DocumentFilters } from '~/types'
import { createDocumentSchema } from '~/validation/presta'
import type { CreateDocumentFormData } from '~/validation/presta'

/**
 * Store de gestion des devis et factures du prestataire.
 *
 * SÉCURITÉ :
 * - downloadDocument vérifie le Content-Type (blob)
 * - Les montants sont validés via Zod (positif, max 999999.99, 2 décimales)
 * - deleteDocument doit être précédé d'une confirmation côté composant
 */
export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<PrestaDocument[]>([])
  const currentDocument = ref<PrestaDocument | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<DocumentFilters>({})

  // --- Getters ---

  const devis = computed(() =>
    documents.value.filter((d) => d.type === 'devis'),
  )

  const factures = computed(() =>
    documents.value.filter((d) => d.type === 'facture'),
  )

  const pendingDocuments = computed(() =>
    documents.value.filter((d) => d.status === 'draft' || d.status === 'sent'),
  )

  const documentCount = computed(() => documents.value.length)

  // --- Actions ---

  async function fetchDocuments(params?: DocumentFilters) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const query = params ?? filters.value
      const data = await apiFetch<{ data: PrestaDocument[] }>('/presta/documents', {
        params: query,
      })
      documents.value = data.data
    } catch {
      error.value = 'Impossible de charger les documents'
    } finally {
      loading.value = false
    }
  }

  async function fetchDocument(id: number) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<PrestaDocument>(`/presta/documents/${id}`)
      currentDocument.value = data
      return data
    } catch {
      error.value = 'Impossible de charger le document'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createDocument(data: CreateDocumentFormData) {
    const validated = createDocumentSchema.parse(data)

    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const created = await apiFetch<PrestaDocument>('/presta/documents', {
        method: 'POST',
        body: validated,
      })
      documents.value.push(created)
      return created
    } catch {
      error.value = 'Impossible de créer le document'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateDocument(id: number, data: Partial<CreateDocumentFormData>) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const updated = await apiFetch<PrestaDocument>(`/presta/documents/${id}`, {
        method: 'PUT',
        body: data,
      })
      const index = documents.value.findIndex((d) => d.id === id)
      if (index !== -1) documents.value[index] = updated
      if (currentDocument.value?.id === id) currentDocument.value = updated
      return updated
    } catch {
      error.value = 'Impossible de modifier le document'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteDocument(id: number) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      await apiFetch(`/presta/documents/${id}`, { method: 'DELETE' })
      documents.value = documents.value.filter((d) => d.id !== id)
      if (currentDocument.value?.id === id) currentDocument.value = null
    } catch {
      error.value = 'Impossible de supprimer le document'
    } finally {
      loading.value = false
    }
  }

  async function sendDocument(id: number) {
    loading.value = true
    error.value = null
    try {
      const { apiFetch } = useApi()
      const updated = await apiFetch<PrestaDocument>(`/presta/documents/${id}/send`, {
        method: 'POST',
      })
      const index = documents.value.findIndex((d) => d.id === id)
      if (index !== -1) documents.value[index] = updated
      if (currentDocument.value?.id === id) currentDocument.value = updated
      return updated
    } catch {
      error.value = 'Impossible d\'envoyer le document'
      return null
    } finally {
      loading.value = false
    }
  }

  async function downloadDocument(id: number) {
    try {
      const { baseURL } = useApi()
      const response = await fetch(`${baseURL}/presta/documents/${id}/download`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Download failed')

      const contentType = response.headers.get('Content-Type') ?? ''
      if (!contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
        error.value = 'Format de fichier inattendu'
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `document-${id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      error.value = 'Impossible de télécharger le document'
    }
  }

  function setFilters(newFilters: DocumentFilters) {
    filters.value = newFilters
  }

  function $reset() {
    documents.value = []
    currentDocument.value = null
    loading.value = false
    error.value = null
    filters.value = {}
  }

  return {
    documents,
    currentDocument,
    loading,
    error,
    filters,
    devis,
    factures,
    pendingDocuments,
    documentCount,
    fetchDocuments,
    fetchDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    sendDocument,
    downloadDocument,
    setFilters,
    $reset,
  }
})
