<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const auth = useAuthStore()

// Redirect to the appropriate dashboard
if (auth.isPresta) {
  await navigateTo('/presta', { replace: true })
} else if (auth.isUser) {
  await navigateTo('/user', { replace: true })
} else {
  await navigateTo('/auth/login', { replace: true })
}
</script>

<template>
  <div />
</template>