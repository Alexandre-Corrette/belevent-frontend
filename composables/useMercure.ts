/**
 * Composable for Mercure SSE subscriptions.
 *
 * - Connects to Mercure hub via EventSource
 * - Auto-reconnect with exponential backoff (1s, 2s, 4s... max 30s)
 * - Subscribe/unsubscribe to topics
 * - Exposes reactive connection status
 */
export const useMercure = () => {
  const config = useRuntimeConfig()
  const mercureUrl = config.public.mercureUrl

  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const eventSources = new Map<string, EventSource>()
  let retryDelay = 1000
  const MAX_RETRY_DELAY = 30000

  function validateTopic(topic: string): boolean {
    // Topics should be URL-safe strings, no scripts
    return /^[\w./-]+$/.test(topic)
  }

  function subscribe(topic: string, callback: (data: unknown) => void): () => void {
    if (!validateTopic(topic)) {
      console.error(`[Mercure] Invalid topic format: ${topic}`)
      return () => {}
    }

    const url = new URL(mercureUrl)
    url.searchParams.append('topic', topic)

    function connect() {
      connectionStatus.value = 'connecting'
      const es = new EventSource(url.toString(), { withCredentials: true })

      es.onopen = () => {
        connectionStatus.value = 'connected'
        retryDelay = 1000 // Reset on successful connection
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          callback(data)
        } catch {
          callback(event.data)
        }
      }

      es.onerror = () => {
        connectionStatus.value = 'disconnected'
        es.close()
        eventSources.delete(topic)

        // Exponential backoff reconnect
        setTimeout(() => {
          if (!eventSources.has(topic)) {
            connect()
          }
        }, retryDelay)

        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      }

      eventSources.set(topic, es)
    }

    connect()

    // Return unsubscribe function
    return () => unsubscribe(topic)
  }

  function unsubscribe(topic: string) {
    const es = eventSources.get(topic)
    if (es) {
      es.close()
      eventSources.delete(topic)
    }
    if (eventSources.size === 0) {
      connectionStatus.value = 'disconnected'
    }
  }

  function disconnectAll() {
    eventSources.forEach((es) => es.close())
    eventSources.clear()
    connectionStatus.value = 'disconnected'
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnectAll()
  })

  return {
    connectionStatus: readonly(connectionStatus),
    subscribe,
    unsubscribe,
    disconnectAll,
  }
}