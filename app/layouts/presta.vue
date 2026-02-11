<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()
const mobileNavOpen = ref(false)

const navItems = [
  { label: 'Mes Événements', icon: '📅', to: '/presta/events' },
  { label: 'Mes Clients', icon: '👥', to: '/presta/clients' },
  { label: 'Nouveau Document', icon: '📄', to: '/presta/documents/new' },
  { label: 'Mes Prestataires', icon: '🤝', to: '/presta/providers' },
  { label: 'Mes Documents', icon: '📋', to: '/presta/documents' },
]

function isActive(to: string): boolean {
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="layout-presta">
    <header class="layout-presta__header">
      <div class="layout-presta__logo">
        <NuxtLink to="/presta" class="layout-presta__logo-text">
          BEL<span>◄</span>EVENT
        </NuxtLink>
        <span class="layout-presta__logo-badge">PRESTA</span>
      </div>

      <button class="layout-presta__hamburger" @click="mobileNavOpen = !mobileNavOpen">
        ☰
      </button>

      <div class="layout-presta__user">
        <span>{{ auth.fullName }}</span>
        <NuxtLink to="/presta/account" class="layout-presta__user-avatar">
          👤
        </NuxtLink>
      </div>
    </header>

    <nav :class="['layout-presta__nav', { 'layout-presta__nav--open': mobileNavOpen }]">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="['layout-presta__nav-item', { 'layout-presta__nav-item--active': isActive(item.to) }]"
        @click="mobileNavOpen = false"
      >
        <span class="layout-presta__nav-item-icon">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <main class="layout-presta__content">
      <slot />
    </main>
  </div>
</template>