<script setup lang="ts">
definePageMeta({ layout: 'presta', middleware: ['auth', 'presta'] })

const { show: showToast } = useToast()

const currentStep = ref(0)

const steps = ref([
  { key: 'client', label: 'Client', completed: false },
  { key: 'event', label: 'Événement', completed: false },
  { key: 'document', label: 'Document', completed: false },
])

const clientId = ref<number | null>(null)
const eventId = ref<number | null>(null)

function handleStep1(payload: { clientId: number }) {
  clientId.value = payload.clientId
  steps.value[0].completed = true
  currentStep.value = 1
}

function handleStep2(payload: { eventId: number }) {
  eventId.value = payload.eventId
  steps.value[1].completed = true
  currentStep.value = 2
}

function handleStep3() {
  steps.value[2].completed = true
  // Last step auto-completes — user clicks "Valider" in BelWizard to finish.
}

function handleStepChange(index: number) {
  if (steps.value[index].completed || index <= currentStep.value) {
    currentStep.value = index
  }
}

function handleComplete() {
  showToast('Document créé.')
  navigateTo('/presta/documents')
}
</script>

<template>
  <div class="presta-document-wizard">
    <div class="presta-document-wizard__header">
      <NuxtLink to="/presta/documents" class="presta-document-wizard__back">
        ← Retour aux documents
      </NuxtLink>
      <h1 class="presta-document-wizard__title">Nouveau document</h1>
    </div>

    <BelWizard
      :steps="steps"
      :current-step="currentStep"
      :completable="steps[2].completed"
      @step-change="handleStepChange"
      @complete="handleComplete"
    >
      <template #step-client>
        <DocumentWizardStep1Client @submit="handleStep1" />
      </template>

      <template #step-event>
        <DocumentWizardStep2Event @submit="handleStep2" />
      </template>

      <template #step-document>
        <DocumentWizardStep3Document
          v-if="clientId !== null && eventId !== null"
          :client-id="clientId"
          :event-id="eventId"
          @submit="handleStep3"
        />
      </template>
    </BelWizard>
  </div>
</template>
