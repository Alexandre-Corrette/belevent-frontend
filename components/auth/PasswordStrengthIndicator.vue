<script setup lang="ts">
interface Props {
  password: string
}

const props = defineProps<Props>()

const criteria = computed(() => [
  { label: 'Min. 8 caractères', met: props.password.length >= 8 },
  { label: '1 majuscule', met: /[A-Z]/.test(props.password) },
  { label: '1 chiffre', met: /\d/.test(props.password) },
  { label: '1 caractère spécial', met: /[^A-Za-z0-9]/.test(props.password) },
])

const score = computed(() => criteria.value.filter((c) => c.met).length)

const level = computed(() => {
  if (score.value <= 1) return { label: 'Très faible', class: 'very-weak' }
  if (score.value === 2) return { label: 'Faible', class: 'weak' }
  if (score.value === 3) return { label: 'Moyen', class: 'medium' }
  return { label: 'Fort', class: 'strong' }
})

const barWidth = computed(() => `${(score.value / 4) * 100}%`)
</script>

<template>
  <div class="password-strength">
    <div class="password-strength__bar">
      <div
        :class="['password-strength__fill', `password-strength__fill--${level.class}`]"
        :style="{ width: barWidth }"
      />
    </div>
    <span :class="['password-strength__label', `password-strength__label--${level.class}`]">
      {{ level.label }}
    </span>

    <ul class="password-strength__criteria">
      <li
        v-for="(criterion, index) in criteria"
        :key="index"
        :class="{ 'password-strength__criterion--met': criterion.met }"
      >
        <span>{{ criterion.met ? '&#x2713;' : '&#x2717;' }}</span>
        {{ criterion.label }}
      </li>
    </ul>
  </div>
</template>