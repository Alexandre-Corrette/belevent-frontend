export function useInvitation(eventId: Ref<string | number>) {
  const { apiFetch } = useApi()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  async function inviteClient(payload: {
    email: string
    firstName: string
    lastName: string
  }): Promise<void> {
    error.value = null
    success.value = false
    isLoading.value = true

    try {
      await apiFetch(`/events/${eventId.value}/invite`, {
        method: 'POST',
        body: payload,
      })
      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'status' in err
          ? (err as { status: number }).status
          : null
      if (status === 422) {
        error.value = 'Veuillez vérifier les informations saisies'
      } else if (status === 409) {
        error.value = 'Ce client est déjà rattaché à cet événement'
      } else {
        error.value = "Impossible d'envoyer l'invitation"
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    success: readonly(success),
    inviteClient,
  }
}
