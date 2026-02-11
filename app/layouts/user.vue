<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()
const mobileNavOpen = ref(false)

const navItems = [
  { label: 'Mes Événements', icon: '📅', to: '/user/events' },
  { label: 'Mon Compte', icon: '👤', to: '/user/account' },
  { label: 'Nouvel Événement', icon: '➕', to: '/user/events/new' },
  { label: 'Mes Prestataires', icon: '🤝', to: '/user/providers' },
  { label: 'Mes Documents', icon: '📋', to: '/user/documents' },
]

function isActive(to: string): boolean {
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="layout-user">
    <header class="layout-user__header">
      <div class="layout-user__logo">
        <NuxtLink to="/user" class="layout-user__logo-text">
          BEL<span>◄</span>EVENT
        </NuxtLink>
        <span class="layout-user__logo-subtitle">Suivi Événementiel</span>
      </div>

      <button class="layout-user__hamburger" @click="mobileNavOpen = !mobileNavOpen">
        ☰
      </button>

      <div class="layout-user__actions">
        <NuxtLink to="/user/account" class="layout-user__cagnotte">
          💰 Ma Cagnotte
        </NuxtLink>
        <div class="layout-user__user">
          <span>{{ auth.fullName }}</span>
          <NuxtLink to="/user/account" class="layout-user__user-avatar">
            👤
          </NuxtLink>
        </div>
      </div>
    </header>

    <nav :class="['layout-user__nav', { 'layout-user__nav--open': mobileNavOpen }]">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="['layout-user__nav-item', { 'layout-user__nav-item--active': isActive(item.to) }]"
        @click="mobileNavOpen = false"
      >
        <span class="layout-user__nav-item-icon">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <main class="layout-user__content">
      <slot />
    </main>
  </div>
</template>