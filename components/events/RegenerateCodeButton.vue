<script setup lang="ts">
interface Props {
  eventId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  regenerated: [code: string]
}>()

const { apiFetch } = useApi()
const { show: showToast } = useToast()

const loading = ref(false)
const showConfirm = ref(false)

async function regenerate() {
  showConfirm.value = false
  loading.value = true

  try {
    const data = await apiFetch<{ inviteCode: string }>(
      `/events/${props.eventId}/regenerate-code`,
      { method: 'POST' },
    )
    emit('regenerated', data.inviteCode)
    showToast('Code régénéré avec succès')
  } catch {
    showToast('Impossible de régénérer le code', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button
    class="regenerate-code-btn"
    type="button"
    title="Régénérer le code"
    :disabled="loading"
    @click="showConfirm = true"
  >
    <span v-if="loading" class="regenerate-code-btn__spinner">&#x23F3;</span>
    <span v-else class="regenerate-code-btn__icon">&#x21BB;</span>
  </button>

  <BelModal v-model="showConfirm" title="Régénérer le code ?" size="sm">
    <p>Êtes-vous sûr ? L'ancien code ne fonctionnera plus.</p>

    <template #footer>
      <BelButton label="Annuler" variant="ghost" @click="showConfirm = false" />
      <BelButton label="Régénérer" variant="danger" @click="regenerate" />
    </template>
  </BelModal>
</template>

<style scoped>
.regenerate-code-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  color: #6b7280;
  transition: color 0.2s, border-color 0.2s;
}

.regenerate-code-btn:hover:not(:disabled) {
  color: #4338ca;
  border-color: #4338ca;
}

.regenerate-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
