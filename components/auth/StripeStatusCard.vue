<script setup lang="ts">
interface Props {
  kbisStatus: 'done' | 'pending' | 'rejected'
  identityStatus: 'done' | 'pending' | 'rejected'
  ribStatus: 'done' | 'pending' | 'rejected'
}

defineProps<Props>()

const items = computed(() => [
  { label: 'KBIS', key: 'kbis' },
  { label: 'IDENTITÉ', key: 'identity' },
  { label: 'RIB', key: 'rib' },
])

function getStatusForItem(key: string, props: Props): 'done' | 'pending' | 'rejected' {
  switch (key) {
    case 'kbis': return props.kbisStatus
    case 'identity': return props.identityStatus
    case 'rib': return props.ribStatus
    default: return 'pending'
  }
}
</script>

<template>
  <div class="stripe-status-card">
    <div
      v-for="item in items"
      :key="item.key"
      class="stripe-status-card__item"
    >
      <BelStatusIcon :status="getStatusForItem(item.key, $props)" />
      <span class="stripe-status-card__label">{{ item.label }}</span>
      <span
        :class="[
          'stripe-status-card__status',
          `stripe-status-card__status--${getStatusForItem(item.key, $props)}`,
        ]"
      >
        {{ getStatusForItem(item.key, $props) === 'done' ? 'Vérifié' : getStatusForItem(item.key, $props) === 'rejected' ? 'Rejeté' : 'En attente' }}
      </span>
    </div>
  </div>
</template>
