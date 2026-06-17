<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import type { ApexAxisChartSeries, ApexNonAxisChartSeries, ApexOptions } from 'apexcharts'
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const props = defineProps<{
  schools: MinistrySchoolRecord[]
}>()

const ApexChart = VueApexCharts
const fontFamily = 'IBM Plex Sans Arabic, sans-serif'
const colors = ['#16a34a', '#2563eb', '#f97316', '#9333ea', '#0f766e', '#dc2626', '#ca8a04', '#4f46e5']

interface DepartmentStaff {
  department: string
  teachers: number
  admins: number
}

interface FacilityRegion {
  region: string
  computerLabs: number
  physicsLabs: number
  chemistryLabs: number
}

interface GenderDistributionItem {
  gender: string
  count: number
  percentage: number
}

const numberFormatter = new Intl.NumberFormat('ar')

function formatNumber(value: number): string {
  const arabicFormatted = numberFormatter.format(value)
  return arabicFormatted.replace(/[\u0660-\u0669]/g, digit => String(parseInt(digit, 36) - 10))
}

// Split grades by level: Primary (1-6), Middle (7-9), High (10-12)
const stageLabels = ['الابتدائية 1-2-3-4-5-6', 'المتوسطة 1-2-3', 'الثانوية 1-2-3-4']
const stageGradeRanges = [
  [1, 2, 3, 4, 5, 6], // Primary
  [7, 8, 9], // Middle
  [10, 11, 12] // High
]

const stageStudentSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'عدد الطلاب',
    data: stageGradeRanges.map((grades) => {
      return props.schools.reduce((sum, school) => {
        return sum + grades.reduce((gradeSum, grade) => {
          const gradeValue = school.students[`grade${grade}` as keyof typeof school.students]
          return gradeSum + (typeof gradeValue === 'number' ? gradeValue : 0)
        }, 0)
      }, 0)
    })
  }
])

const gradeLabels = ['صف 1', 'صف 2', 'صف 3', 'صف 4', 'صف 5', 'صف 6', 'صف 7', 'صف 8', 'صف 9', 'صف 10', 'صف 11', 'صف 12']

const gradeSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'عدد الطلاب',
    data: gradeLabels.map((label, index) => props.schools.reduce((sum, school) => {
      const gradeValue = school.students[`grade${index + 1}` as keyof typeof school.students]
      return sum + (typeof gradeValue === 'number' ? gradeValue : 0)
    }, 0))
  }
])

const totalStudents = computed(() => props.schools.reduce((sum, school) => sum + (school.students?.total || 0), 0))

const genderDistribution = computed<GenderDistributionItem[]>(() => {
  const counts = new Map<string, number>()
  const total = props.schools.length || 1

  for (const school of props.schools) {
    const gender = school.identity.gender || 'غير محدد'
    counts.set(gender, (counts.get(gender) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([gender, count]) => ({ gender, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || a.gender.localeCompare(b.gender, 'ar'))
})

const genderSeries = computed<ApexNonAxisChartSeries>(() => genderDistribution.value.map(item => item.count))

const genderCategories = computed(() => genderDistribution.value.map(item => item.gender))

const genderChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'pie',
    fontFamily,
    toolbar: { show: false }
  },
  colors: colors.slice(0, Math.max(genderCategories.value.length, 1)),
  labels: genderCategories.value,
  plotOptions: {
    pie: {
      donut: { size: '45%' }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${formatNumber(val)}%`,
    style: { fontFamily }
  },
  legend: { position: 'bottom', rtl: true, fontFamily }
}))

const departmentStaff = computed<DepartmentStaff[]>(() => {
  const grouped = new Map<string, DepartmentStaff>()

  for (const school of props.schools) {
    const department = school.identity.educationDepartment || 'غير محدد'
    const current = grouped.get(department) || { department, teachers: 0, admins: 0 }

    current.teachers += school.staff.teachers
    current.admins += school.staff.admins
    grouped.set(department, current)
  }

  return Array.from(grouped.values())
    .sort((a, b) => (b.teachers + b.admins) - (a.teachers + a.admins))
    .slice(0, 10)
})

const staffSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'المعلمون',
    data: departmentStaff.value.map(item => item.teachers)
  },
  {
    name: 'الإداريون',
    data: departmentStaff.value.map(item => item.admins)
  }
])

const stages = computed(() => Array.from(new Set(props.schools.map(school => school.identity.stage).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')))
const authorities = computed(() => Array.from(new Set(props.schools.map(school => school.identity.authority).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')))

const authorityStageSeries = computed<ApexAxisChartSeries>(() => authorities.value.map(authority => ({
  name: authority,
  data: stages.value.map(stage => props.schools.filter(school => school.identity.authority === authority && school.identity.stage === stage).length)
})))

const facilityRegions = computed<FacilityRegion[]>(() => {
  const grouped = new Map<string, FacilityRegion>()

  for (const school of props.schools) {
    const region = school.identity.administrativeRegion || school.identity.educationDepartment || 'غير محدد'
    const current = grouped.get(region) || { region, computerLabs: 0, physicsLabs: 0, chemistryLabs: 0 }

    current.computerLabs += school.facilities.computerLabs
    current.physicsLabs += school.facilities.physicsLabs
    current.chemistryLabs += school.facilities.chemistryLabs
    grouped.set(region, current)
  }

  return Array.from(grouped.values())
    .sort((a, b) => (b.computerLabs + b.physicsLabs + b.chemistryLabs) - (a.computerLabs + a.physicsLabs + a.chemistryLabs))
    .slice(0, 10)
})

const facilitySeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'معامل الكمبيوتر',
    data: facilityRegions.value.map(item => item.computerLabs)
  },
  {
    name: 'مختبرات فيزياء',
    data: facilityRegions.value.map(item => item.physicsLabs)
  },
  {
    name: 'مختبرات كيمياء',
    data: facilityRegions.value.map(item => item.chemistryLabs)
  }
])

const gradeChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '56%',
      distributed: true
    }
  },
  colors: colors.slice(0, gradeSeries.value[0]?.data.length || 1),
  xaxis: {
    categories: gradeLabels,
    labels: { style: { fontFamily } },
    title: { text: 'الصفوف الدراسية', style: { fontFamily } }
  },
  yaxis: {
    title: { text: 'عدد الطلاب', style: { fontFamily } },
    labels: { style: { fontFamily } }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily }
  },
  tooltip: { theme: 'light' }
}))

const staffChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '56%'
    }
  },
  colors: ['#16a34a', '#2563eb'],
  xaxis: {
    categories: departmentStaff.value.map(item => item.department),
    labels: {
      style: { fontFamily },
      rotate: -35
    }
  },
  yaxis: {
    title: { text: 'عدد الكادر', style: { fontFamily } },
    labels: { style: { fontFamily } }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily }
  },
  tooltip: { theme: 'light' }
}))

const authorityStageChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false },
    stacked: true
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '64%'
    }
  },
  colors: colors.slice(0, authorities.value.length),
  xaxis: {
    categories: stages.value,
    labels: { style: { fontFamily } }
  },
  yaxis: {
    title: { text: 'عدد المدارس', style: { fontFamily } },
    labels: { style: { fontFamily } }
  },
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily,
    fontSize: '12px'
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily }
  },
  tooltip: { theme: 'light' }
}))

const facilityChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '56%',
      distributed: true
    }
  },
  colors: ['#16a34a', '#f97316', '#9333ea'],
  xaxis: {
    categories: facilityRegions.value.map(item => item.region),
    labels: {
      style: { fontFamily },
      rotate: -35
    }
  },
  yaxis: {
    title: { text: 'عدد الغرف/المعامل', style: { fontFamily } },
    labels: { style: { fontFamily } }
  },
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily,
    fontSize: '12px'
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily }
  },
  tooltip: { theme: 'light' }
}))

const stageStudentChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false }
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '30%',
      distributed: true
    }
  },
  colors: ['#16a34a', '#2563eb', '#f97316'],
  xaxis: {
    categories: stageLabels,
    labels: { style: { fontFamily } },
    title: { text: 'المراحل الدراسية', style: { fontFamily } }
  },
  yaxis: {
    title: { text: 'عدد الطلاب', style: { fontFamily } },
    labels: { style: { fontFamily } }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily }
  },
  tooltip: { theme: 'light' }
}))
</script>

<template>
  <section
    v-if="schools.length"
    dir="rtl"
    class="grid gap-6"
  >
    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المدارس حسب الجنس
            </h2>
            <UIcon
              name="i-lucide-pie-chart"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          type="pie"
          :options="genderChart"
          :series="genderSeries"
          height="320"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              الطلاب حسب المرحلة
            </h2>
            <UIcon
              name="i-lucide-users-round"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          type="bar"
          :options="stageStudentChart"
          :series="stageStudentSeries"
          height="320"
        />
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع المدارس حسب السلطة والمرحلة
          </h2>
          <UIcon
            name="i-lucide-layers-3"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        type="bar"
        :options="authorityStageChart"
        :series="authorityStageSeries"
        height="320"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توافر المعامل حسب المنطقة
          </h2>
          <UIcon
            name="i-lucide-monitor-check"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        type="bar"
        :options="facilityChart"
        :series="facilitySeries"
        height="320"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع الطلاب حسب الصفوف
          </h2>
          <UIcon
            name="i-lucide-chart-column"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        type="bar"
        :options="gradeChart"
        :series="gradeSeries"
        height="300"
      />
    </UCard>
  </section>
</template>