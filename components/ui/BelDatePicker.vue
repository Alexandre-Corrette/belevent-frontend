<script setup lang="ts">
interface Props {
  modelValue: string
  mode?: 'date' | 'month'
  label?: string
  placeholder?: string
  error?: string
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'date',
  label: undefined,
  placeholder: undefined,
  error: undefined,
  min: undefined,
  max: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const viewDate = ref(new Date())
const dropdownRef = ref<HTMLElement | null>(null)

const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

const displayValue = computed(() => {
  if (!props.modelValue) return null
  const d = new Date(props.modelValue)
  if (isNaN(d.getTime())) return null
  if (props.mode === 'month') {
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  return d.toLocaleDateString('fr-FR')
})

const monthLabel = computed(() => {
  return `${MONTHS[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-based: getDay() returns 0 for Sunday
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const days: Array<{ date: Date; outside: boolean }> = []

  // Previous month days
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), outside: true })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), outside: false })
  }

  // Fill remaining to 42 (6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), outside: true })
  }

  return days
})

function isSelected(date: Date): boolean {
  if (!props.modelValue) return false
  const selected = new Date(props.modelValue)
  return (
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth() &&
    date.getDate() === selected.getDate()
  )
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isDisabled(date: Date): boolean {
  if (props.min && date < new Date(props.min)) return true
  if (props.max && date > new Date(props.max)) return true
  return false
}

function selectDate(date: Date) {
  if (isDisabled(date)) return
  emit('update:modelValue', date.toISOString().split('T')[0])
  isOpen.value = false
}

function previousMonth() {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() - 1)
  viewDate.value = d

  if (props.mode === 'month') {
    emit('update:modelValue', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }
}

function nextMonth() {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() + 1)
  viewDate.value = d

  if (props.mode === 'month') {
    emit('update:modelValue', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

// Initialize viewDate from modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) viewDate.value = d
    }
  },
  { immediate: true },
)
</script>

<template>
  <div :class="['bel-date-picker', { 'bel-date-picker--error': error }]">
    <span v-if="label" class="bel-date-picker__label">{{ label }}</span>

    <!-- Month mode: inline nav -->
    <div v-if="mode === 'month'" class="bel-date-picker__month-nav">
      <button type="button" aria-label="Mois précédent" @click="previousMonth">&lsaquo;</button>
      <span>{{ monthLabel }}</span>
      <button type="button" aria-label="Mois suivant" @click="nextMonth">&rsaquo;</button>
    </div>

    <!-- Date mode: trigger + calendar dropdown -->
    <template v-else>
      <div
        :class="[
          'bel-date-picker__trigger',
          { 'bel-date-picker__trigger--placeholder': !displayValue },
        ]"
        @click="isOpen = !isOpen"
      >
        <span>{{ displayValue || placeholder || 'JJ/MM/AAAA' }}</span>
        <span>&#x1F4C5;</span>
      </div>

      <div v-if="isOpen" ref="dropdownRef" class="bel-date-picker__calendar">
        <div class="bel-date-picker__month-nav">
          <button type="button" @click="previousMonth">&lsaquo;</button>
          <span>{{ monthLabel }}</span>
          <button type="button" @click="nextMonth">&rsaquo;</button>
        </div>

        <div class="bel-date-picker__grid">
          <div v-for="day in DAYS" :key="day" class="bel-date-picker__day-header">{{ day }}</div>
          <div
            v-for="(item, index) in calendarDays"
            :key="index"
            :class="[
              'bel-date-picker__day',
              {
                'bel-date-picker__day--selected': isSelected(item.date),
                'bel-date-picker__day--today': isToday(item.date),
                'bel-date-picker__day--disabled': isDisabled(item.date),
                'bel-date-picker__day--outside': item.outside,
              },
            ]"
            @click="selectDate(item.date)"
          >
            {{ item.date.getDate() }}
          </div>
        </div>
      </div>
    </template>

    <span v-if="error" class="bel-date-picker__error" role="alert">{{ error }}</span>
  </div>
</template>