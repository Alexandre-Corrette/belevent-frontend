<script setup lang="ts">
import type { EventItem } from '~/types'

definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const { apiFetch } = useApi()

const eventId = computed(() => Number(route.params.id))
const event = ref<EventItem | null>(null)
const showInviteModal = ref(false)

const hasClient = computed(() => !!event.value?.clientId)

async function fetchEvent() {
  try {
    event.value = await apiFetch<EventItem>(`/events/${eventId.value}`)
  } catch {
    // handled by empty state
  }
}

function onClientInvited() {
  fetchEvent()
}

onMounted(() => {
  fetchEvent()
})
</script>

<template>
  <div class="event-detail">
    <h1 class="event-detail__title">Détail Événement</h1>

    <template v-if="event">
      <div class="event-detail__actions">
        <BelButton
          label="Inviter le client"
          :disabled="hasClient"
          :title="hasClient ? 'Un client est déjà rattaché' : undefined"
          @click="showInviteModal = true"
        />
      </div>

      <InviteClientModal
        v-model="showInviteModal"
        :event-id="eventId"
        :has-client="hasClient"
        @invited="onClientInvited"
      />
    </template>

    <p v-else>Chargement...</p>
  </div>
</template>
