<script setup lang="ts">
interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

interface Props {
  columns: Column[]
  data: Record<string, unknown>[]
  loading?: boolean
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'Aucune donnée',
  sortBy: undefined,
  sortDirection: 'asc',
})

const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc']
  'row-click': [row: Record<string, unknown>]
}>()

function handleSort(column: Column) {
  if (!column.sortable) return
  const direction = props.sortBy === column.key && props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('sort', column.key, direction)
}

function getSortIcon(column: Column): string {
  if (props.sortBy !== column.key) return '↕'
  return props.sortDirection === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="bel-table">
    <table class="bel-table__table">
      <thead class="bel-table__header">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : undefined"
            :class="{ 'bel-table__sortable': col.sortable }"
            @click="handleSort(col)"
          >
            {{ col.label }}
            <span
              v-if="col.sortable"
              :class="[
                'bel-table__sort-icon',
                { 'bel-table__sort-icon--active': sortBy === col.key },
              ]"
            >
              {{ getSortIcon(col) }}
            </span>
          </th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr>
          <td :colspan="columns.length" class="bel-table__loading">
            <div class="bel-table__spinner" />
            Chargement...
          </td>
        </tr>
      </tbody>

      <tbody v-else-if="data.length === 0">
        <tr>
          <td :colspan="columns.length" class="bel-table__empty">
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr
          v-for="(row, index) in data"
          :key="index"
          class="bel-table__row"
          @click="emit('row-click', row)"
        >
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>