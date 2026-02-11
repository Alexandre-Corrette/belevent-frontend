<script setup lang="ts">
interface Step {
  key: string
  label: string
  completed: boolean
}

interface Props {
  steps: Step[]
  currentStep: number
  completable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  completable: false,
})

const emit = defineEmits<{
  'step-change': [stepIndex: number]
  complete: []
}>()

function goToStep(index: number) {
  // Can only go to completed steps or the next uncompleted one
  if (props.steps[index].completed || index <= props.currentStep) {
    emit('step-change', index)
  }
}

function next() {
  if (props.currentStep < props.steps.length - 1) {
    emit('step-change', props.currentStep + 1)
  }
}

function previous() {
  if (props.currentStep > 0) {
    emit('step-change', props.currentStep - 1)
  }
}

const isLastStep = computed(() => props.currentStep === props.steps.length - 1)
const currentStepKey = computed(() => props.steps[props.currentStep]?.key)
</script>

<template>
  <div class="bel-wizard">
    <div class="bel-wizard__steps">
      <template v-for="(step, index) in steps" :key="step.key">
        <div
          v-if="index > 0"
          :class="[
            'bel-wizard__separator',
            { 'bel-wizard__separator--completed': step.completed },
          ]"
        />
        <div
          :class="[
            'bel-wizard__step',
            {
              'bel-wizard__step--completed': step.completed,
              'bel-wizard__step--active': index === currentStep,
            },
          ]"
          @click="goToStep(index)"
        >
          <span class="bel-wizard__step-number">
            <template v-if="step.completed">&#x2713;</template>
            <template v-else>{{ index + 1 }}</template>
          </span>
          {{ step.label }}
        </div>
      </template>
    </div>

    <div class="bel-wizard__content">
      <slot :name="`step-${currentStepKey}`" />
    </div>

    <div class="bel-wizard__actions">
      <BelButton
        v-if="currentStep > 0"
        label="Précédent"
        variant="outline"
        @click="previous"
      />
      <div v-else />

      <BelButton
        v-if="isLastStep"
        :label="completable ? 'Valider' : 'Valider'"
        :variant="completable ? 'primary' : 'outline'"
        :disabled="!completable"
        @click="emit('complete')"
      />
      <BelButton
        v-else
        label="Suivant"
        variant="primary"
        @click="next"
      />
    </div>
  </div>
</template>