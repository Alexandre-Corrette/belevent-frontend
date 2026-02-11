<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { contactSchema } from '~/validation/company'

const companyStore = useCompanyStore()

const showAddModal = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref<number | null>(null)
const deleting = ref(false)

const contactColumns = [
  { key: 'lastName', label: 'NOM' },
  { key: 'firstName', label: 'PRÉNOM' },
  { key: 'email', label: 'EMAIL' },
  { key: 'role', label: 'RÔLE', width: '140px' },
  { key: 'actions', label: '', width: '80px' },
]

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  commercial: 'Commercial',
  comptabilite: 'Comptabilité',
}

const contactsAsRecords = computed(() =>
  companyStore.contacts.map((c) => ({
    ...c,
    id: c.id,
    roleLabel: roleLabels[c.role] || c.role,
  })) as unknown as Record<string, unknown>[],
)

// --- Add contact form ---
const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(contactSchema),
})

const { value: contactEmail, errorMessage: emailError } = useField<string>('email')
const { value: contactFirstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: contactLastName, errorMessage: lastNameError } = useField<string>('lastName')
const { value: contactRole, errorMessage: roleError } = useField<string>('role')
const { value: contactPhone, errorMessage: phoneError } = useField<string>('phone')

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'comptabilite', label: 'Comptabilité' },
]

function openAddModal() {
  resetForm()
  showAddModal.value = true
}

const onAddContact = handleSubmit(async (values) => {
  await companyStore.addContact({
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    role: values.role as 'admin' | 'commercial' | 'comptabilite',
    phone: values.phone || undefined,
  })
  showAddModal.value = false
  resetForm()
})

function confirmDelete(id: number) {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deleteTargetId.value) return
  deleting.value = true
  try {
    await companyStore.deleteContact(deleteTargetId.value)
  } finally {
    deleting.value = false
    showDeleteModal.value = false
    deleteTargetId.value = null
  }
}

onMounted(() => {
  companyStore.fetchContacts()
})
</script>

<template>
  <div class="contacts-tab">
    <div class="contacts-tab__header">
      <h3 class="contacts-tab__title">Mes Contacts</h3>
      <BelButton label="+" size="sm" @click="openAddModal" />
    </div>

    <BelTable
      :columns="contactColumns"
      :data="contactsAsRecords"
      empty-message="Aucun contact"
    >
      <template #cell-role="{ row }">
        {{ (row as Record<string, unknown>).roleLabel }}
      </template>
      <template #cell-actions="{ row }">
        <button
          class="contacts-tab__delete-btn"
          aria-label="Supprimer"
          @click.stop="confirmDelete((row as Record<string, unknown>).id as number)"
        >
          &#x1F5D1;
        </button>
      </template>
    </BelTable>

    <!-- Modal ajout contact -->
    <BelModal v-model="showAddModal" title="Nouveau contact">
      <form class="contacts-tab__form" @submit.prevent="onAddContact">
        <BelInput v-model="contactEmail" label="Email" type="email" :error="emailError" required />
        <BelInput v-model="contactFirstName" label="Prénom" :error="firstNameError" required />
        <BelInput v-model="contactLastName" label="Nom" :error="lastNameError" required />
        <BelSelect
          v-model="contactRole"
          label="Rôle"
          :options="roleOptions"
          :error="roleError"
        />
        <BelInput v-model="contactPhone" label="Mobile" type="tel" :error="phoneError" />
      </form>

      <template #footer>
        <BelButton label="Annuler" variant="ghost" @click="showAddModal = false" />
        <BelButton label="VALIDER" :loading="isSubmitting" @click="onAddContact" />
      </template>
    </BelModal>

    <!-- Modal suppression -->
    <BelModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p>Voulez-vous vraiment supprimer ce contact ?</p>

      <template #footer>
        <BelButton label="Annuler" variant="ghost" @click="showDeleteModal = false" />
        <BelButton label="Supprimer" variant="danger" :loading="deleting" @click="executeDelete" />
      </template>
    </BelModal>
  </div>
</template>