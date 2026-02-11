<script setup lang="ts">
interface Props {
  status: 'done' | 'pending' | 'rejected' | 'shipping' | 'none'
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  size: 'md',
})

const ICONS: Record<string, string> = {
  done: '✓',
  pending: '⏳',
  rejected: '✗',
  shipping: '📦',
  none: '—',
}

const LABELS: Record<string, string> = {
  done: 'Terminé',
  pending: 'En attente',
  rejected: 'Refusé',
  shipping: 'En cours',
  none: 'Non défini',
}
</script>

<template>
  <span
    :class="['bel-status-icon', `bel-status-icon--${status}`, `bel-status-icon--${size}`]"
    :title="LABELS[status]"
    :aria-label="LABELS[status]"
    role="img"
  >
    {{ ICONS[status] }}
  </span>
</template>