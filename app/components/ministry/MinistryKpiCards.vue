<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const props = defineProps<{
  schools: MinistrySchoolRecord[]
  warningCount: number
  hasActiveFilters: boolean
}>()

const totalStages = computed(() => props.schools?.length || 0)
const totalSchools = computed(() => {
  const managers = (props.schools || [])
    .map(school => String(school.staff?.managerName || '').trim())
    .filter(name => Boolean(name))
  return new Set(managers).size
})

const schoolIds = computed(() => props.schools.map(s => String(s.identity.id || '')).filter(Boolean))
const displayedSchoolIds = computed(() => {
  if (!props.hasActiveFilters || schoolIds.value.length === 0) return ''
  const max = 6
  if (schoolIds.value.length <= max) {
    return schoolIds.value.join('، ')
  }
  return schoolIds.value.slice(0, max).join('، ') + '، ...'
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
const totalTeachers = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.staff?.teachers || 0), 0))
const totalAdmins = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.staff?.admins || 0), 0))
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

const totalClasses = computed(() => (props.schools || []).reduce((sum, school) => sum + (school.students?.classes || 0), 0))
const classDensityPerStage = computed(() => totalClasses.value ? (totalStudents.value / totalClasses.value).toFixed(1) : '0')
const studentTeacherRatio = computed(() => totalTeachers.value ? (totalStudents.value / totalTeachers.value).toFixed(1) : '0')

const avgStudentsPerSchool = computed(() => totalSchools.value ? (totalStudents.value / totalSchools.value).toFixed(0) : '0')
const avgTeachersPerSchool = computed(() => totalSchools.value ? (totalTeachers.value / totalSchools.value).toFixed(0) : '0')
const avgAdminsPerSchool = computed(() => totalSchools.value ? (totalAdmins.value / totalSchools.value).toFixed(1) : '0')
const adminTeacherRatio = computed(() => totalTeachers.value ? ((totalAdmins.value / totalTeachers.value) * 100).toFixed(1) : '0')
const teachersStaffRatio = computed(() => totalStaff.value ? ((totalTeachers.value / totalStaff.value) * 100).toFixed(1) : '0')
const avgStagesPerSchool = computed(() => totalSchools.value ? (totalStages.value / totalSchools.value).toFixed(1) : '0')

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

const cards = computed(() => [
  {
    title: props.hasActiveFilters ? 'المدارس حسب التصفية' : 'إجمالي المدارس',
    value: formatNumber(totalSchools.value),
    description: props.hasActiveFilters ? displayedSchoolIds.value : `حسب عدد المباني المدرسية الفعلية ${totalSchools.value !== totalStages.value ? `، إجمالي المراحل ${formatNumber(totalStages.value)}` : ''}`,
    icon: 'i-lucide-building-2'
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
    title: 'الكادر الوظيفي معلمون',
    value: formatNumber(totalTeachers.value),
    description: 'عدد المعلمين في المدارس',
    icon: 'i-lucide-user-check'
  },
  {
    title: 'الكادر الوظيفي اداريون',
    value: formatNumber(totalAdmins.value),
    description: 'عدد الإداريين في المدارس٫ يشمل (عام - مستخدمين - بند اجور)',
    icon: 'i-lucide-briefcase'
  },
  {
    title: 'نسبة المدارس الحكومية حسب المراحل',
    value: `${formatNumber(governmentRatio.value)}%`,
    description: `${formatNumber(governmentBuildings.value)} من أصل ${formatNumber(totalStages.value)} مرحلة`,
    icon: 'i-lucide-circle-help'
  },
  {
    title: 'نسبة المدارس الحكومية حسب المبنى',
    value: `${formatNumber(governmentManagerRatio.value)}%`,
    description: `${formatNumber(governmentBuildingsByManager.value)} من أصل ${formatNumber(uniqueManagers.value.size)} مبنى`,
    icon: 'i-lucide-user-check'
  },
  {
    title: 'معدل كثافة الفصول',
    value: classDensityPerStage.value,
    description: `${formatNumber(totalStudents.value)} طالب / ${formatNumber(totalClasses.value)} فصل`,
    icon: 'i-lucide-layers'
  },
  {
    title: 'معدل الطلاب لكل معلم',
    value: studentTeacherRatio.value,
    description: `${formatNumber(totalStudents.value)} طالب / ${formatNumber(totalTeachers.value)} معلم`,
    icon: 'i-lucide-ratio'
  },
  {
    title: 'متوسط الطلاب لكل مدرسة',
    value: avgStudentsPerSchool.value,
    description: 'حجم المدارس بشكل عام',
    icon: 'i-lucide-users'
  },
  {
    title: 'متوسط المعلمين لكل مدرسة',
    value: avgTeachersPerSchool.value,
    description: 'مؤشر توزيع الكادر',
    icon: 'i-lucide-user-check'
  },
  {
    title: 'متوسط الإداريين لكل مدرسة',
    value: avgAdminsPerSchool.value,
    description: 'تقييم الكادر الإداري',
    icon: 'i-lucide-briefcase'
  },
  {
    title: 'نسبة الإداريين إلى المعلمين',
    value: `${adminTeacherRatio.value}%`,
    description: 'التوازن بين الكادر التعليمي والإداري',
    icon: 'i-lucide-scale'
  },
  {
    title: 'نسبة المعلمين من إجمالي الكادر',
    value: `${teachersStaffRatio.value}%`,
    description: 'قياس كفاءة التوزيع الوظيفي',
    icon: 'i-lucide-percent'
  },
  {
    title: 'متوسط المراحل لكل مدرسة',
    value: avgStagesPerSchool.value,
    description: 'مدى انتشار المدارس المشتركة',
    icon: 'i-lucide-layers'
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

          <p class="mt-3 text-3xl text-primary font-semibold tracking-tight text-foreground">
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
