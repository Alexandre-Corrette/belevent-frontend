<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="bel-toast-container">
      <TransitionGroup name="bel-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['bel-toast', `bel-toast--${toast.type}`]"
          role="status"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.bel-toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bel-toast {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
}

.bel-toast--success {
  background-color: #16a34a;
}

.bel-toast--error {
  background-color: #dc2626;
}

.bel-toast-enter-active,
.bel-toast-leave-active {
  transition: all 0.3s ease;
}

.bel-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.bel-toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
