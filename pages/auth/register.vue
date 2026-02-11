<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: ['guest'] })

const authStore = useAuthStore()
const companyStore = useCompanyStore()
const router = useRouter()

const currentStep = ref(0)

const steps = ref([
  { key: 'identifiants', label: 'Identifiants', completed: false },
  { key: 'entreprise', label: 'Entreprise', completed: false },
  { key: 'verification', label: 'Vérification', completed: false },
])

const step1Ref = ref<InstanceType<typeof import('~/components/auth/RegisterStep1.vue').default> | null>(null)
const step2Ref = ref<InstanceType<typeof import('~/components/auth/RegisterStep2.vue').default> | null>(null)

async function handleStep1(data: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  try {
    await authStore.register({
      email: data.email,
      password: data.password,
      passwordConfirmation: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    steps.value[0].completed = true
    currentStep.value = 1
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : null

    if (status === 409 && step1Ref.value) {
      step1Ref.value.serverError = 'Cette adresse email est déjà utilisée'
    }
  }
}

async function handleStep2(data: {
  siret: string
  companyName: string
  address: string
}) {
  try {
    await companyStore.createCompany(data)
    steps.value[1].completed = true
    currentStep.value = 2
  } catch (err: unknown) {
    if (step2Ref.value) {
      step2Ref.value.serverError = 'Ce SIRET est déjà enregistré'
    }
  }
}

function handleStepChange(index: number) {
  if (steps.value[index].completed || index <= currentStep.value) {
    currentStep.value = index
  }
}

async function handleComplete() {
  await router.push('/presta')
}
</script>

<template>
  <div class="auth-register">
    <h1 class="auth-register__title">Inscription</h1>

    <BelWizard
      :steps="steps"
      :current-step="currentStep"
      :completable="steps[2].completed"
      @step-change="handleStepChange"
      @complete="handleComplete"
    >
      <template #step-identifiants>
        <RegisterStep1 ref="step1Ref" @submit="handleStep1" />
      </template>

      <template #step-entreprise>
        <RegisterStep2 ref="step2Ref" @submit="handleStep2" />
      </template>

      <template #step-verification>
        <RegisterStep3 />
      </template>
    </BelWizard>

    <div class="auth-register__links">
      <NuxtLink to="/auth/login" class="auth-register__link">
        Déjà un compte ? Se connecter
      </NuxtLink>
    </div>
  </div>
</template>
