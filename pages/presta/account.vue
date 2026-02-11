<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'company', label: 'MON ENTREPRISE' },
  { key: 'bank', label: 'MA BANQUE' },
  { key: 'contacts', label: 'MES CONTACTS' },
]

const activeTab = computed({
  get: () => (route.query.tab as string) || 'company',
  set: (value: string) => {
    router.replace({ query: { ...route.query, tab: value } })
  },
})
</script>

<template>
  <div class="presta-account">
    <h1 class="presta-account__title">Mon Compte</h1>

    <BelTabs v-model="activeTab" :tabs="tabs" />

    <div class="presta-account__content">
      <CompanyTab v-if="activeTab === 'company'" />
      <BankTab v-else-if="activeTab === 'bank'" />
      <ContactsTab v-else-if="activeTab === 'contacts'" />
    </div>
  </div>
</template>
