<script setup lang="ts">
interface Props {
  code: string
  eventId?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:code': [code: string]
}>()
const { show: showToast } = useToast()

const displayCode = computed(() => `EVT-${props.code}`)

const shareMessage = computed(
  () =>
    `Rejoignez mon événement sur BelEvent !\nCode : ${displayCode.value}\n👉 https://app.belevent.fr/join?code=${props.code}`,
)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(displayCode.value)
    showToast('Code copié !')
  } catch {
    // Fallback for older browsers
    showToast('Impossible de copier', 'error')
  }
}

async function share() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Invitation BelEvent',
        text: shareMessage.value,
      })
    } catch {
      // User cancelled or share failed — silent
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareMessage.value)
      showToast('Message copié !')
    } catch {
      showToast('Impossible de partager', 'error')
    }
  }
}
</script>

<template>
  <div class="invite-code-display">
    <div class="invite-code-display__code-row">
      <p class="invite-code-display__code">{{ displayCode }}</p>
      <RegenerateCodeButton
        v-if="eventId"
        :event-id="eventId"
        @regenerated="(code) => emit('update:code', code)"
      />
    </div>

    <div class="invite-code-display__actions">
      <BelButton
        label="Copier le code"
        variant="outline"
        size="sm"
        @click="copyCode"
      />
      <BelButton
        label="Partager"
        variant="outline"
        size="sm"
        @click="share"
      />
    </div>
  </div>
</template>

<style scoped>
.invite-code-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f0f4ff;
  border-radius: 12px;
  border: 2px dashed #6366f1;
}

.invite-code-display__code-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.invite-code-display__code {
  font-family: monospace;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #4338ca;
  margin: 0;
}

.invite-code-display__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
