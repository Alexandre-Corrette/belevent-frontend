/**
 * Composable for Mercure SSE subscriptions.
 *
 * Two usage patterns:
 * 1. Simple: useMercure(topic, onMessage) — auto-subscribes, cleanup on unmount
 * 2. Advanced: useMercure() then .subscribe(topic, callback)
 *
 * Features:
 * - Auto-reconnect with exponential backoff (1s → 30s max)
 * - JSON parsing of messages
 * - Topic validation
 * - Cleanup on unmount
 */
export function useMercure(topic?: string, onMessage?: (data: unknown) => void) {
  const config = useRuntimeConfig()
  const mercureUrl = config.public.mercureUrl

  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const error = ref<string | null>(null)
  const eventSources = new Map<string, EventSource>()
  let retryDelay = 1000
  const MAX_RETRY_DELAY = 30000

  const isConnected = computed(() => connectionStatus.value === 'connected')

  function validateTopic(t: string): boolean {
    return /^[\w./-]+$/.test(t)
  }

  function subscribe(t: string, callback: (data: unknown) => void): () => void {
    if (!validateTopic(t)) {
      error.value = `Format de topic invalide : ${t}`
      return () => {}
    }

    error.value = null
    const url = new URL(mercureUrl)
    url.searchParams.append('topic', t)

    function connect() {
      connectionStatus.value = 'connecting'
      const es = new EventSource(url.toString(), { withCredentials: true })

      es.onopen = () => {
        connectionStatus.value = 'connected'
        error.value = null
        retryDelay = 1000
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
        error.value = 'Connexion au serveur perdue'
        es.close()
        eventSources.delete(t)

        setTimeout(() => {
          if (!eventSources.has(t)) {
            connect()
          }
        }, retryDelay)

        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      }

      eventSources.set(t, es)
    }

    connect()
    return () => unsubscribe(t)
  }

  function unsubscribe(t: string) {
    const es = eventSources.get(t)
    if (es) {
      es.close()
      eventSources.delete(t)
    }
    if (eventSources.size === 0) {
      connectionStatus.value = 'disconnected'
    }
  }

  function close() {
    eventSources.forEach((es) => es.close())
    eventSources.clear()
    connectionStatus.value = 'disconnected'
  }

  // Auto-subscribe if topic + callback provided
  if (topic && onMessage) {
    subscribe(topic, onMessage)
  }

  onUnmounted(() => {
    close()
  })

  return {
    isConnected,
    connectionStatus: readonly(connectionStatus),
    error: readonly(error),
    subscribe,
    unsubscribe,
    close,
  }
}
