<script setup lang="ts">
const { showWarning, secondsLeft, continueSession } = useInactivityTimeout()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modal d'inactivité -->
    <BelModal
      :model-value="showWarning"
      title="Session inactive"
      size="sm"
      :closable="false"
      @update:model-value="continueSession"
    >
      <p class="inactivity-warning__text">
        Votre session va expirer dans <strong>{{ secondsLeft }}</strong> secondes.
      </p>

      <template #footer>
        <BelButton label="Continuer" @click="continueSession" />
      </template>
    </BelModal>
  </div>
</template>
