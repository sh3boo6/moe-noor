<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const props = defineProps<{
  schools: MinistrySchoolRecord[]
  warningCount: number
}>()

const totalStages = computed(() => props.schools?.length || 0)
const totalSchools = computed(() => {
  const managers = (props.schools || [])
    .map(school => String(school.staff?.managerName || '').trim())
    .filter(name => Boolean(name))
  return new Set(managers).size
})
const uniqueManagers = computed(() => {
  const ids = (props.schools || [])
    .map(school => String(school.staff?.managerId || '').trim())
    .filter(id => Boolean(id))
  return new Set(ids)
})
const totalStudents = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.students?.total || 0), 0))
const saudiStudents = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.students?.saudi || 0), 0))
const saudiRatio = computed(() => totalStudents.value ? Math.round((saudiStudents.value / totalStudents.value) * 100) : 0)
const totalStaff = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.staff?.teachers || 0) + (school.staff?.admins || 0), 0))
const governmentBuildings = computed(() => (props.schools || []).filter(school => school.building?.ownership && school.building.ownership.includes('حكومي')).length)
const governmentRatio = computed(() => totalStages.value ? Math.round((governmentBuildings.value / totalStages.value) * 100) : 0)

const governmentBuildingsByManager = computed(() => {
  const managerIds = new Set(uniqueManagers.value)
  let count = 0
  for (const school of props.schools || []) {
    const managerId = String(school.staff?.managerId || '').trim()
    if (managerId && managerIds.has(managerId) && school.building?.ownership && school.building.ownership.includes('حكومي')) {
      count++
      managerIds.delete(managerId)
    }
  }
  return count
})

const governmentManagerRatio = computed(() => uniqueManagers.value.size ? Math.round((governmentBuildingsByManager.value / uniqueManagers.value.size) * 100) : 0)

const mismatchedSchools = computed(() => (props.schools || []).filter(school => (school.students?.gradeTotalMismatch || 0) > 0).length)

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

const cards = computed(() => [
  {
    title: 'إجمالي المدارس',
    value: formatNumber(totalSchools.value),
    description: 'حسب عدد المباني المدرسية الفعلية',
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
    description: `نسبة السعوديين ${formatNumber(saudiRatio.value)}%`,
    icon: 'i-lucide-users'
  },
  {
    title: 'الكادر الوظيفي',
    value: formatNumber(totalStaff.value),
    description: 'معلمون وإداريون',
    icon: 'i-lucide-id-card'
  },
  {
    title: 'نسبة المدارس الحكومية حسب المراحل',
    value: `${formatNumber(governmentRatio.value)}%`,
    description: `${formatNumber(governmentBuildings.value)} من أصل ${formatNumber(totalStages.value)} مرحلة`,
    icon: 'i-lucide-circle-help'
  },
  {
    title: 'نسبة المدارس الحكومية حسب المدير',
    value: `${formatNumber(governmentManagerRatio.value)}%`,
    description: `${formatNumber(governmentBuildingsByManager.value)} من أصل ${formatNumber(uniqueManagers.value.size)} مدير`,
    icon: 'i-lucide-user-check'
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
      class="rounded-2xl border border-accented/50 bg-card p-5 shadow-sm"
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
            class="h-10 w-10 object-contain"
          >
        </div>
      </div>

      <p class="mt-4 text-xs leading-5 text-muted-foreground">
        {{ card.description }}
      </p>
    </article>

    <article class="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-right dark:border-amber-700/60 dark:bg-amber-950/30">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-amber-700 dark:text-amber-300">
            تنبيه جودة البيانات
          </p>

          <p class="mt-3 text-3xl font-semibold tracking-tight text-amber-800 dark:text-amber-100">
            {{ formatNumber(mismatchedSchools) }}
          </p>
        </div>

        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
          <UIcon
            name="i-lucide-triangle-alert"
            class="h-5 w-5"
          />
        </div>
      </div>

      <p class="mt-4 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">
        مدارس يختلف فيها مجموع الصفوف 1-9 عن جملة طلاب.
      </p>
    </article>
  </section>
</template>
