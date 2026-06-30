<script setup lang="ts">
import type { MinistryFilters } from '~/types/ministrySchool'
import type { FilterOptionDef } from '~/composables/useSchoolFilters'

const props = defineProps<{
  filters: MinistryFilters
  options: FilterOptionDef[]
}>()

const emit = defineEmits<{
  change: [key: keyof MinistryFilters, value: string[]]
  clear: [key: keyof MinistryFilters]
}>()

function handleUpdate(key: keyof MinistryFilters, value: string[]) {
  emit('change', key, value)
}

function clearFilter(key: keyof MinistryFilters) {
  emit('clear', key)
}
</script>

<template>
  <UCard dir="rtl">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            الفلترة المتقدمة
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            صفّ البيانات حسب إدارة التعليم، المنطقة، المرحلة، الجنس، السلطة، نوع المبنى، وقت الدراسة، نوع التعليم والمحاسبة واسم المدرسة.
          </p>
        </div>

        <UIcon
          name="i-lucide-sliders-horizontal"
          class="h-5 w-5 text-primary"
        />
      </div>
    </template>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:[&>*:last-child]:col-span-3">
      <div
        v-for="filter in props.options"
        :key="filter.key"
        class="flex flex-col gap-2 text-sm font-medium text-foreground"
      >
        <div class="flex items-center justify-between">
          <span>{{ filter.label }}</span>

          <UButton
            v-if="props.filters[filter.key]?.length > 0"
            variant="link"
            color="error"
            trailing-icon="i-lucide-funnel-x"
            size="xs"
            class="p-0 underline cursor-pointer decoration-dotted hover:text-red-600"
            @click="clearFilter(filter.key)"
          >
            الكل
          </UButton>
        </div>

        <USelectMenu
          :key="filter.key"
          :model-value="props.filters[filter.key]"
          :items="filter.options"
          :placeholder="filter.placeholder"
          multiple
          size="xl"
          class="w-full"
          @update:model-value="handleUpdate(filter.key, $event)"
        />
      </div>
    </div>
  </UCard>
</template>
