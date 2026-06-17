<script setup lang="ts">
import type { SchoolRecord } from '~/types/school'

const numberFormatter = new Intl.NumberFormat('ar')

const props = defineProps<{
  schools: SchoolRecord[]
}>()

const totalStages = computed(() => props.schools?.length || 0)
const totalSchools = computed(() => {
  const managers = (props.schools || [])
    .map(school => String(school.managerName || '').trim())
    .filter(name => Boolean(name))
  return new Set(managers).size
})
const totalStudents = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.students || 0), 0))
const totalClasses = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.classes || 0), 0))
const governmentBuildings = computed(() => (props.schools || []).filter(school => school.buildingOwnership && school.buildingOwnership.includes('حكومي')).length)
const governmentRatio = computed(() => totalStages.value ? Math.round((governmentBuildings.value / totalStages.value) * 100) : 0)

// تعرض الأرقام الكبيرة بتنسيق عربي لتبدو واضحة داخل البطاقات.
function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

const cards = computed(() => [
  {
    title: 'إجمالي المدارس',
    value: formatNumber(totalSchools.value),
    description: 'حسب عدد المدراء (مدرستين بمدير واحد تحسب كواحدة)',
    icon: 'i-lucide-building-2'
  },
  {
    title: 'إجمالي المراحل',
    value: formatNumber(totalStages.value),
    description: 'عدد السجلات المقروءة من الملف',
    icon: 'i-lucide-layers'
  },
  {
    title: 'إجمالي الطلاب',
    value: formatNumber(totalStudents.value),
    description: 'مجموع عمود جملة طلاب',
    icon: 'i-lucide-users'
  },
  {
    title: 'إجمالي الفصول',
    value: formatNumber(totalClasses.value),
    description: 'مجموع عمود فصول جملة',
    icon: 'i-lucide-graduation-cap'
  },
  {
    title: 'المباني الحكومية',
    value: `${formatNumber(governmentRatio.value)}%`,
    description: `${formatNumber(governmentBuildings.value)} من أصل ${formatNumber(totalStages.value)} مرحلة`,
    icon: 'i-lucide-circle-help'
  }
])
</script>

<template>
  <section
    dir="rtl"
    class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
  >
    <article
      v-for="card in cards"
      :key="card.title"
      class="rounded-2xl border border-border/50 bg-card p-5 shadow-sm"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-muted-foreground">
            {{ card.title }}
          </p>

          <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {{ card.value }}
          </p>
        </div>

        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <img
            src="/img/logo.png"
            alt=""
            class="h-5 w-5 object-contain"
          >
        </div>
      </div>

      <p class="mt-4 text-xs leading-5 text-muted-foreground">
        {{ card.description }}
      </p>
    </article>
  </section>
</template>
