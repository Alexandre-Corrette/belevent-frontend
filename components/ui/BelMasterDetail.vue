<script setup lang="ts">
interface Props {
  showDetail: boolean
  masterWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  masterWidth: '35%',
})

const emit = defineEmits<{
  back: []
}>()
</script>

<template>
  <div :class="['bel-master-detail', { 'bel-master-detail--show-detail': showDetail }]">
    <div class="bel-master-detail__master" :style="{ width: masterWidth }">
      <slot name="master" />
    </div>

    <div class="bel-master-detail__detail">
      <button class="bel-master-detail__back" @click="emit('back')">
        ← Retour
      </button>
      <slot name="detail" />
    </div>
  </div>
</template>