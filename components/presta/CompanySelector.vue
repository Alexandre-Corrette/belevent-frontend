<script setup lang="ts">
const companyStore = useCompanyStore()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const hasMultiple = computed(() => companyStore.companyList.length > 1)
const currentName = computed(() => companyStore.currentCompany?.name ?? 'Aucune entreprise')

function toggle() {
  if (hasMultiple.value) {
    isOpen.value = !isOpen.value
  }
}

async function selectCompany(id: number) {
  isOpen.value = false
  await companyStore.switchCompany(id)
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="dropdownRef" class="company-selector">
    <button
      :class="[
        'company-selector__trigger',
        { 'company-selector__trigger--clickable': hasMultiple },
      ]"
      @click="toggle"
    >
      <span class="company-selector__name">{{ currentName }}</span>
      <span v-if="hasMultiple" :class="['company-selector__chevron', { 'company-selector__chevron--open': isOpen }]">
        &#x25BC;
      </span>
    </button>

    <div v-if="isOpen" class="company-selector__dropdown">
      <button
        v-for="company in companyStore.companyList"
        :key="company.id"
        :class="[
          'company-selector__option',
          { 'company-selector__option--active': company.id === companyStore.currentCompany?.id },
        ]"
        @click="selectCompany(company.id)"
      >
        {{ company.name }}
      </button>
    </div>
  </div>
</template>
