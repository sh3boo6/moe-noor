<script setup lang="ts">
import type { MinistryFilters } from '~/types/ministrySchool'

interface FilterOption {
  key: keyof MinistryFilters
  label: string
  placeholder: string
  options: string[]
}

const props = defineProps<{
  filters: MinistryFilters
  options: FilterOption[]
}>()

const emit = defineEmits<{
  change: [key: keyof MinistryFilters, value: string[]]
}>()

const filterModels = ref<Record<keyof MinistryFilters, string[]>>({
  educationDepartment: [],
  administrativeRegion: [],
  stage: [],
  gender: [],
  authority: [],
  buildingOwnership: [],
  studyTime: [],
  educationType: [],
  governorate: []
})

watch(
  () => props.filters,
  (newFilters) => {
    filterModels.value = { ...newFilters }
  },
  { immediate: true, deep: true }
)

function updateFilter(key: keyof MinistryFilters, value: string[]) {
  filterModels.value[key] = value
  emit('change', key, value)
}

// دالة لمسح قيم فلتر معين وإرسال التحديث للمكون الأب
function clearFilter(key: keyof MinistryFilters) {
  filterModels.value[key] = []
  emit('change', key, [])
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
            صفّ البيانات حسب إدارة التعليم، المنطقة، المرحلة، الجنس، السلطة، نوع المبنى، وقت الدراسة، نوع التعليم والمحافظة.
          </p>
        </div>

        <UIcon
          name="i-lucide-sliders-horizontal"
          class="h-5 w-5 text-primary"
        />
      </div>
    </template>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:[&>*:last-child]:col-span-full">
      <div
        v-for="filter in props.options"
        :key="filter.key"
        class="flex flex-col gap-2 text-sm font-medium text-foreground"
      >
        <div class="flex items-center justify-between">
          <span>{{ filter.label }}</span>

          <UButton
            v-if="filterModels[filter.key]?.length > 0"
            variant="link"
            color="red"
            trailing-icon="i-lucide-funnel-x"
            size="xs"
            class="p-0 underline cursor-pointer decoration-dotted hover:text-red-600"
            @click="clearFilter(filter.key)"
          >
            الكل
          </UButton>
        </div>

        <USelectMenu
          v-model="filterModels[filter.key]"
          size="xl"
          :items="filter.options"
          :placeholder="`الكل`"
          multiple
          class="w-full"
          @update:model-value="updateFilter(filter.key, $event)"
        />
      </div>
    </div>
  </UCard>
</template>
