<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import * as XLSX from 'xlsx'

const props = defineProps<{
  schools: MinistrySchoolRecord[]
  warningCount: number
  hasActiveFilters: boolean
  allSchools?: MinistrySchoolRecord[]
}>()

const totalStages = computed(() => props.schools?.length || 0)
const totalSchools = computed(() => {
  return (props.schools || []).filter((school) => {
    const status = String(school.building?.independenceStatus || '').trim()
    return status === 'مستقل' || status === 'مشترك أساسي'
  }).length
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
const adminTeacherRatio = computed(() => totalTeachers.value ? (totalAdmins.value / totalTeachers.value).toFixed(2) : '0.00')
const teachersStaffRatio = computed(() => totalStaff.value ? ((totalTeachers.value / totalStaff.value) * 100).toFixed(1) : '0')
const avgStagesPerSchool = computed(() => totalSchools.value ? (totalStages.value / totalSchools.value).toFixed(1) : '0')

const showSchoolsModal = ref(false)

const schoolSearch = ref('')
const schoolPage = ref(1)
const schoolPageSize = ref(15)
const drawerManagerId = ref<string | null>(null)
const drawerSchoolName = ref('')
const showDrawer = ref(false)
const stageCountSort = ref<'asc' | 'desc' | null>(null)
const independenceStatusSort = ref<'asc' | 'desc' | null>(null)
const ownershipSort = ref<'asc' | 'desc' | null>(null)

const filteredSchoolsForModal = computed(() => {
  const keyword = schoolSearch.value.toLocaleLowerCase('ar')
  let result = (props.schools || []).filter((school) => {
    const status = String(school.building?.independenceStatus || '').trim()
    return status === 'مستقل' || status === 'مشترك أساسي'
  })

  if (keyword) {
    result = result.filter((school) => {
      const searchableText = [
        school.identity.schoolName,
        school.identity.id,
        school.staff.managerName,
        school.staff.managerId,
        school.building.independenceStatus,
        school.additional.sharedSchoolMinistryNumber
      ].join(' ').toLocaleLowerCase('ar')
      return searchableText.includes(keyword)
    })
  }

  if (stageCountSort.value) {
    result = [...result].sort((a, b) => {
      const aVal = getManagerStageCount(a)
      const bVal = getManagerStageCount(b)
      return stageCountSort.value === 'asc' ? aVal - bVal : bVal - aVal
    })
  }

  if (independenceStatusSort.value) {
    result = [...result].sort((a, b) => {
      const aVal = String(a.building?.independenceStatus || '').trim()
      const bVal = String(b.building?.independenceStatus || '').trim()
      if (aVal === bVal) return 0
      if (independenceStatusSort.value === 'asc') {
        return aVal.localeCompare(bVal, 'ar')
      }
      return bVal.localeCompare(aVal, 'ar')
    })
  }

  if (ownershipSort.value) {
    result = [...result].sort((a, b) => {
      const aVal = String(a.building?.ownership || '').trim()
      const bVal = String(b.building?.ownership || '').trim()
      if (aVal === bVal) return 0
      if (ownershipSort.value === 'asc') {
        return aVal.localeCompare(bVal, 'ar')
      }
      return bVal.localeCompare(aVal, 'ar')
    })
  }

  return result
})

const modalIndependentCount = computed(() => filteredSchoolsForModal.value.filter(school => String(school.building?.independenceStatus || '').trim() === 'مستقل').length)
const modalSharedBasicCount = computed(() => filteredSchoolsForModal.value.filter(school => String(school.building?.independenceStatus || '').trim() === 'مشترك أساسي').length)

const totalSchoolPages = computed(() => Math.max(1, Math.ceil(filteredSchoolsForModal.value.length / schoolPageSize.value)))
const paginatedSchoolsForModal = computed(() => {
  const start = (schoolPage.value - 1) * schoolPageSize.value
  return filteredSchoolsForModal.value.slice(start, start + schoolPageSize.value)
})
const schoolPageStart = computed(() => filteredSchoolsForModal.value.length ? (schoolPage.value - 1) * schoolPageSize.value + 1 : 0)
const schoolPageEnd = computed(() => Math.min(schoolPage.value * schoolPageSize.value, filteredSchoolsForModal.value.length))

watch(totalSchoolPages, (value) => {
  if (schoolPage.value > value) {
    schoolPage.value = value
  }
})

watch(schoolSearch, () => {
  schoolPage.value = 1
})

watch([stageCountSort, independenceStatusSort, ownershipSort], () => {
  schoolPage.value = 1
})

function toggleStageCountSort() {
  if (stageCountSort.value === null) {
    stageCountSort.value = 'asc'
  } else if (stageCountSort.value === 'asc') {
    stageCountSort.value = 'desc'
  } else {
    stageCountSort.value = null
  }
}

function toggleIndependenceStatusSort() {
  if (independenceStatusSort.value === null) {
    independenceStatusSort.value = 'asc'
  } else if (independenceStatusSort.value === 'asc') {
    independenceStatusSort.value = 'desc'
  } else {
    independenceStatusSort.value = null
  }
}

function toggleOwnershipSort() {
  if (ownershipSort.value === null) {
    ownershipSort.value = 'asc'
  } else if (ownershipSort.value === 'asc') {
    ownershipSort.value = 'desc'
  } else {
    ownershipSort.value = null
  }
}

function goToSchoolPage(nextPage: number) {
  schoolPage.value = Math.min(Math.max(nextPage, 1), totalSchoolPages.value)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'غير محدد'
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat('ar').format(value)
  }
  return String(value)
}

const managerStageCounts = computed(() => {
  const counts = new Map<string, number>()
  const source = props.allSchools || props.schools || []
  for (const school of source) {
    const managerId = String(school.staff?.managerId || '').trim()
    if (managerId) {
      counts.set(managerId, (counts.get(managerId) || 0) + 1)
    }
  }
  return counts
})

function getManagerStageCount(school: MinistrySchoolRecord): number {
  const managerId = String(school.staff?.managerId || '').trim()
  return managerId ? (managerStageCounts.value.get(managerId) || 0) : 0
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function exportToExcel() {
  const headers = [
    'الرقم الوزاري',
    'اسم المدرسة',
    'المدير',
    'رقم الهوية',
    'جنس المدرسة',
    'عدد المراحل',
    'حالة الاستقلال',
    'نوع المبنى'
  ]

  const rows = filteredSchoolsForModal.value.map(school => [
    formatValue(school.identity.id),
    formatValue(school.identity.schoolName),
    formatValue(school.staff.managerName),
    formatValue(school.staff.managerId),
    formatValue(school.identity.gender),
    getManagerStageCount(school),
    formatValue(school.building.independenceStatus),
    formatValue(school.building.ownership)
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المدارس')
  XLSX.writeFile(workbook, 'schools_export.xlsx')
}

const firstCardTitle = computed(() => cards.value[0]?.title ?? '')

const cards = computed(() => [
  {
    title: props.hasActiveFilters ? 'المباني حسب التصفية' : 'إجمالي المباني',
    value: formatNumber(totalSchools.value),
    description: props.hasActiveFilters ? `حسب التصفية عدد المباني المدرسية الفعلية، إجمالي المراحل ${formatNumber(totalStages.value)}` : `حسب عدد المباني المدرسية الفعلية ${totalSchools.value !== totalStages.value ? `، إجمالي المراحل ${formatNumber(totalStages.value)}` : ''}`,
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
    title: 'معدل اداري لكل معلم',
    value: adminTeacherRatio.value,
    description: 'عدد الإداريين لكل معلم',
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

      <div class="mt-4 flex items-center justify-baseline gap-3">
        <p class="text-xs leading-5 text-muted-foreground">
          {{ card.description }}
        </p>

        <UButton
          v-if="card.title === 'إجمالي المباني' || card.title === 'المباني حسب التصفية'"
          size="xs"
          color="neutral"
          variant="ghost"
          label="عرض"
          icon="i-lucide-table-2"
          class=""
          @click="showSchoolsModal = true;"
        />
      </div>
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

    <UModal
      v-model:open="showSchoolsModal"
      fullscreen
      :title="firstCardTitle"
      size="xl"
    >
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h3 class="text-lg font-semibold text-foreground flex items-center gap-3">
              <span>{{ firstCardTitle }}</span>
              <sup class="text-primary font-bold">{{ filteredSchoolsForModal.length }}</sup>
            </h3>
          </div>
          <UInput
            v-model="schoolSearch"
            class="w-full sm:w-80"
            placeholder="ابحث باسم المدرسة، المدير، الهوية أو الحالة"
            icon="i-lucide-search"
          />
          <UButton
            icon="i-lucide:x"
            variant="ghost"
            class="ms-auto"
            color="neutral"
            size="xl"
            @click="showSchoolsModal = false;"
          />
        </div>
      </template>

      <template #body>
        <div
          class="overflow-x-auto rounded-2xl border border-accented/50"
        >
          <table class="w-full min-w-max border-collapse text-right text-sm">
            <thead class="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  الرقم الوزاري
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  اسم المدرسة
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  المدير
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  رقم الهوية
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  جنس المدرسة
                </th>
                <th
                  class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold cursor-pointer select-none"
                  @click="toggleStageCountSort"
                >
                  <div class="flex items-center gap-1">
                    <span>عدد المراحل</span>
                    <span
                      v-if="stageCountSort"
                      class="text-primary"
                    >
                      {{ stageCountSort === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th
                  class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold cursor-pointer select-none"
                  @click="toggleIndependenceStatusSort"
                >
                  <div class="flex items-center gap-1">
                    <span>حالة الاستقلال</span>
                    <span
                      v-if="independenceStatusSort"
                      class="text-primary"
                    >
                      {{ independenceStatusSort === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th
                  class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold cursor-pointer select-none"
                  @click="toggleOwnershipSort"
                >
                  <div class="flex items-center gap-1">
                    <span>نوع المبنى</span>
                    <span
                      v-if="ownershipSort"
                      class="text-primary"
                    >
                      {{ ownershipSort === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border bg-card">
              <tr
                v-for="school in paginatedSchoolsForModal"
                :key="school.identity.id"
                class="transition-colors hover:bg-muted/40"
              >
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ formatValue(school.identity.id) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ formatValue(school.identity.schoolName) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ formatValue(school.staff.managerName) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ formatValue(school.staff.managerId) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ formatValue(school.identity.gender) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground text-center">
                  <div v-if="getManagerStageCount(school) === 1">
                    <span>{{ getManagerStageCount(school) }}</span>
                  </div>
                  <div v-else>
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      :label="String(getManagerStageCount(school))"
                      @click.stop="drawerManagerId = String(school.staff?.managerId || '').trim(); drawerSchoolName = String(school.identity.schoolName || '').trim(); showDrawer = true"
                    />
                  </div>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  <UBadge
                    v-if="formatValue(school.building.independenceStatus) == 'مستقل'"
                    color="primary"
                    variant="outline"
                  >
                    {{ formatValue(school.building.independenceStatus) }}
                  </UBadge>
                  <UBadge
                    v-else
                    color="secondary"
                    variant="outline"
                  >
                    {{ formatValue(school.building.independenceStatus) }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  <UBadge
                    v-if="formatValue(school.building.ownership) == 'حكومي'"
                    color="primary"
                    variant="outline"
                  >
                    {{ formatValue(school.building.ownership) }}
                  </UBadge>
                  <UBadge
                    v-else-if="formatValue(school.building.ownership) == 'مستأجر'"
                    color="warning"
                    variant="outline"
                  >
                    {{ formatValue(school.building.ownership) }}
                  </UBadge>
                  <UBadge
                    v-else-if="formatValue(school.building.ownership) == 'هبة'"
                    color="success"
                    variant="outline"
                  >
                    {{ formatValue(school.building.ownership) }}
                  </UBadge>
                  <UBadge
                    v-else
                    color="neutral"
                    variant="outline"
                  >
                    {{ formatValue(school.building.ownership) }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end items-center text-xs px-2 mt-2 gap-4">
          <div class="flex items-center gap-3">
            <span class="text-primary">مستقل:</span>
            <strong>{{ modalIndependentCount }}</strong>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-secondary">مشترك:</span>
            <strong>{{ modalSharedBasicCount }}</strong>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between justify-end">
          <UButton
            icon="i-lucide-file-spreadsheet"
            label="تصدير Excel"
            color="primary"
            variant="solid"
            size="sm"
            @click="exportToExcel"
          />

          <div class="text-sm text-muted-foreground">
            عرض {{ schoolPageStart }} - {{ schoolPageEnd }} من {{ filteredSchoolsForModal.length }} سجل
          </div>

          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-2 text-sm text-muted-foreground">
              الصفوف
              <select
                v-model.number="schoolPageSize"
                class="rounded-xl border border-accented/50 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="15">15</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>

            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                label="السابق"
                :disabled="schoolPage === 1"
                @click="goToSchoolPage(schoolPage - 1)"
              />

              <span class="min-w-20 text-center text-sm text-foreground">
                صفحة {{ schoolPage }} من {{ totalSchoolPages }}
              </span>

              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                label="التالي"
                :disabled="schoolPage === totalSchoolPages"
                @click="goToSchoolPage(schoolPage + 1)"
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UDrawer
      v-model:open="showDrawer"
      :title="drawerManagerId ? `المبنى: ${drawerSchoolName}` : ''"
      description="قائمة المراحل التابعة لهذا المبنى"
      side="bottom"
      class="sm:max-w-full"
      @update:open="(open: boolean) => { if (!open) { drawerManagerId = null; drawerSchoolName = '' } }"
    >
      <template #body>
        <div class="max-h-96 overflow-y-auto">
          <!-- وضع ol مرة واحدة في الخارج -->
          <ol
            v-if="drawerManagerId && (props.allSchools || props.schools || []).filter(s => String(s.staff?.managerId || '').trim() === drawerManagerId).length > 0"
            class="list-decimal list-inside"
          >
            <!-- تكرار الـ li هنا ووضع v-for عليه -->
            <li
              v-for="school in (props.allSchools || props.schools || []).filter(s => String(s.staff?.managerId || '').trim() === drawerManagerId)"
              :key="school.identity.id"
              class="cursor-pointer px-4 py-3 text-sm text-foreground hover:bg-muted/40 border-b border-accented/50 last:border-b-0"
            >
              {{ school.identity.schoolName }} - {{ school.identity.id }}
            </li>
          </ol>

          <!-- رسالة "لا توجد نتائج" في حال عدم وجود مدارس -->
          <div
            v-if="!drawerManagerId || !(props.allSchools || props.schools || []).filter(s => String(s.staff?.managerId || '').trim() === drawerManagerId).length"
            class="px-4 py-3 text-sm text-muted-foreground"
          >
            لا توجد نتائج
          </div>
        </div>
      </template>
    </UDrawer>
  </section>
</template>
