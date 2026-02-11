<script setup lang="ts">
const companyStore = useCompanyStore()

const editing = ref(false)
const editForm = ref({
  address: '',
  phone: '',
  website: '',
})
const saving = ref(false)

const company = computed(() => companyStore.currentCompany)

function startEdit() {
  if (!company.value) return
  editForm.value = {
    address: company.value.address || '',
    phone: company.value.phone || '',
    website: company.value.website || '',
  }
  editing.value = true
}

async function saveEdit() {
  if (!company.value) return
  saving.value = true
  try {
    await companyStore.updateCompany(company.value.id, {
      address: editForm.value.address,
      phone: editForm.value.phone || null,
      website: editForm.value.website || null,
    })
    editing.value = false
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  editing.value = false
}

onMounted(() => {
  companyStore.fetchCompanies()
})
</script>

<template>
  <div class="company-tab">
    <template v-if="company">
      <div class="company-tab__grid">
        <div class="company-tab__field">
          <span class="company-tab__label">Type</span>
          <span class="company-tab__value">{{ company.type }}</span>
        </div>

        <div class="company-tab__field">
          <span class="company-tab__label">Nom</span>
          <span class="company-tab__value">{{ company.name }}</span>
        </div>

        <div class="company-tab__field">
          <span class="company-tab__label">SIREN</span>
          <span class="company-tab__value company-tab__value--readonly">{{ company.siren }}</span>
        </div>

        <div class="company-tab__field">
          <span class="company-tab__label">SIRET</span>
          <span class="company-tab__value company-tab__value--readonly">{{ company.siret }}</span>
        </div>

        <div class="company-tab__field">
          <span class="company-tab__label">N° TVA</span>
          <span class="company-tab__value company-tab__value--readonly">{{ company.tvaNumber || '—' }}</span>
        </div>

        <!-- Champs éditables -->
        <template v-if="!editing">
          <div class="company-tab__field">
            <span class="company-tab__label">Adresse</span>
            <span class="company-tab__value">{{ company.address }}</span>
          </div>

          <div class="company-tab__field">
            <span class="company-tab__label">Téléphone</span>
            <span class="company-tab__value">{{ company.phone || '—' }}</span>
          </div>

          <div class="company-tab__field">
            <span class="company-tab__label">Site web</span>
            <span class="company-tab__value">{{ company.website || '—' }}</span>
          </div>

          <div class="company-tab__actions">
            <BelButton label="Modifier" variant="outline" size="sm" @click="startEdit" />
          </div>
        </template>

        <!-- Mode édition -->
        <template v-else>
          <div class="company-tab__field">
            <BelInput v-model="editForm.address" label="Adresse" />
          </div>

          <div class="company-tab__field">
            <BelInput v-model="editForm.phone" label="Téléphone" type="tel" />
          </div>

          <div class="company-tab__field">
            <BelInput v-model="editForm.website" label="Site web" />
          </div>

          <div class="company-tab__actions">
            <BelButton label="Annuler" variant="ghost" size="sm" @click="cancelEdit" />
            <BelButton label="Enregistrer" size="sm" :loading="saving" @click="saveEdit" />
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <p class="company-tab__empty">Aucune entreprise sélectionnée.</p>
    </template>
  </div>
</template>
