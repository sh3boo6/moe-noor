<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts'
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import { normalizeGender, normalizeStage, toEnglishDigits } from '~/utils/normalize'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const props = defineProps<{
  schools: MinistrySchoolRecord[]
}>()

const ApexChart = VueApexCharts
const fontFamily = 'IBM Plex Sans Arabic, sans-serif'
const seriesColors = ['#16a34a', '#2563eb', '#f97316', '#9333ea', '#0f766e', '#dc2626', '#ca8a04', '#4f46e5']

interface DepartmentStaff {
  department: string
  teachers: number
  admins: number
}

export interface FacilityData {
  name: string
  compBoys: number
  compGirls: number
  physBoys: number
  physGirls: number
  chemBoys: number
  chemGirls: number
  total: number
}

const numberFormatter = new Intl.NumberFormat('ar')

function formatNumber(value: number): string {
  return toEnglishDigits(numberFormatter.format(value))
}

const stageLabels = ['الابتدائية', 'المتوسطة', 'الثانوية', 'رياض الأطفال']
const stageGradeRanges = [
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3],
  [1, 2, 3],
  [1, 2, 3]
]

const stageFilters = [
  (stage: string) => {
    const s = normalizeStage(stage)
    return !s.includes('متوسطه') && !s.includes('ثانوىه') && !s.includes('رىاض الاطفال')
  },
  (stage: string) => {
    const s = normalizeStage(stage)
    return s.includes('متوسطه') || s.includes('اعدادي')
  },
  (stage: string) => {
    const s = normalizeStage(stage)
    return s.includes('ثانوىه')
  },
  (stage: string) => {
    const s = normalizeStage(stage)
    return s.includes('رىاض الاطفال')
  }
]

const primaryGradeLabels = ['صف 1', 'صف 2', 'صف 3', 'صف 4', 'صف 5', 'صف 6']
const middleGradeLabels = ['صف 1', 'صف 2', 'صف 3']
const highGradeLabels = ['صف 1', 'صف 2', 'صف 3']
const kindergartenLabels = ['صف 1', 'صف 2', 'صف 3']

const stageGradeLabels = [
  primaryGradeLabels,
  middleGradeLabels,
  highGradeLabels,
  kindergartenLabels
]

function buildGradeGenderSeries(stageIndex: number) {
  const grades = stageGradeRanges[stageIndex]!
  const labels = stageGradeLabels[stageIndex]!
  const stageFilter = stageFilters[stageIndex]!

  const boysData = labels.map((_, labelIndex) =>
    props.schools
      .filter(school => stageFilter(school.identity.stage) && normalizeGender(school.identity.gender || '') === 'بنين')
      .reduce((sum, school) => {
        const gradeValue = school.students[`grade${grades[labelIndex]}` as keyof typeof school.students]
        return sum + (typeof gradeValue === 'number' ? gradeValue : 0)
      }, 0)
  )

  const girlsData = labels.map((_, labelIndex) =>
    props.schools
      .filter(school => stageFilter(school.identity.stage) && normalizeGender(school.identity.gender || '') === 'بنات')
      .reduce((sum, school) => {
        const gradeValue = school.students[`grade${grades[labelIndex]}` as keyof typeof school.students]
        return sum + (typeof gradeValue === 'number' ? gradeValue : 0)
      }, 0)
  )

  const series: ApexAxisChartSeries = [
    { name: 'بنين', data: boysData },
    { name: 'بنات', data: girlsData }
  ]
  return series
}

const primaryGradeSeries = computed<ApexAxisChartSeries>(() => buildGradeGenderSeries(0))
const middleGradeSeries = computed<ApexAxisChartSeries>(() => buildGradeGenderSeries(1))
const highGradeSeries = computed<ApexAxisChartSeries>(() => buildGradeGenderSeries(2))
const kindergartenSeries = computed<ApexAxisChartSeries>(() => buildGradeGenderSeries(3))

function toChartNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getSeriesValue(series: ApexAxisChartSeries, seriesIndex: number, dataIndex: number): number {
  const value = series[seriesIndex]?.data[dataIndex]
  return toChartNumber(value)
}

function getSeriesTotal(series: ApexAxisChartSeries): number {
  let total = 0

  for (const item of series) {
    const values = Array.isArray(item.data) ? item.data : []

    for (const value of values) {
      total += toChartNumber(value)
    }
  }

  return total
}

function gradeChartBaseOptions(labels: string[], title: string, series: ApexAxisChartSeries): ApexOptions {
  const totals = labels.map((_, index) => formatNumber(getSeriesValue(series, 0, index) + getSeriesValue(series, 1, index)))

  return {
    chart: {
      type: 'bar' as const,
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '56%'
      }
    },
    colors: ['#2563eb', '#db2777'],
    xaxis: {
      categories: labels.map((label, index) => `${label}\nالإجمالي: ${totals[index]}`),
      title: { text: title }
    },
    yaxis: {
      title: { text: 'عدد الطلاب' }
    },
    grid: { show: false },
    dataLabels: {
      enabled: true,
      distributed: false,
      style: { fontFamily, fontSize: '12px', fontWeight: 500 }
    },
    legend: { position: 'bottom' as const, fontFamily }
  } as unknown as ApexOptions
}

const primaryGradeChart = computed(() => gradeChartBaseOptions(primaryGradeLabels, 'الصفوف الدراسية - الابتدائية', primaryGradeSeries.value))
const middleGradeChart = computed(() => gradeChartBaseOptions(middleGradeLabels, 'الصفوف الدراسية - المتوسطة', middleGradeSeries.value))
const highGradeChart = computed(() => gradeChartBaseOptions(highGradeLabels, 'الصفوف الدراسية - الثانوية', highGradeSeries.value))
const kindergartenChart = computed(() => gradeChartBaseOptions(kindergartenLabels, 'الصفوف الدراسية - رياض الأطفال', kindergartenSeries.value))

const genderDistribution = computed(() => {
  const grouped = new Map<string, number>()
  for (const school of props.schools) {
    const gender = normalizeGender(school.identity.gender || 'غير محدد')
    grouped.set(gender, (grouped.get(gender) || 0) + 1)
  }
  return Array.from(grouped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
})

const genderSeries = computed(() => genderDistribution.value.map(item => item.count))

const genderChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'pie' as const,
    fontFamily,
    toolbar: { show: false },
    background: isDark.value ? '#1e293b' : '#ffffff',
    theme: { mode: isDark.value ? 'dark' : 'light' },
    foreColor: isDark.value ? '#e2e8f0' : '#374151'
  },
  labels: genderDistribution.value.map(item => item.label),
  series: genderSeries.value,
  colors: ['#2563eb', '#db2777'],
  legend: {
    position: 'bottom' as const,
    rtl: true,
    fontFamily,
    fontSize: '12px'
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: { fontFamily, fontSize: '12px' }
  }
}) as unknown as ApexOptions)

const _stageStudentSeries = computed<ApexAxisChartSeries>(() => [{
  name: 'عدد الطلاب',
  data: stageLabels.map((_, index) =>
    props.schools.filter(school => stageFilters[index]!(school.identity.stage)).reduce(
      (sum, school) => sum + (typeof school.students.total === 'number' ? school.students.total : 0), 0
    )
  )
}])

const stageStudentGenderSeries = computed<ApexAxisChartSeries>(() => {
  const boysData = stageLabels.map((_, index) =>
    props.schools.filter(school => stageFilters[index]!(school.identity.stage) && normalizeGender(school.identity.gender || '') === 'بنين').reduce(
      (sum, school) => sum + (typeof school.students.total === 'number' ? school.students.total : 0), 0
    ))

  const girlsData = stageLabels.map((_, index) =>
    props.schools.filter(school => stageFilters[index]!(school.identity.stage) && normalizeGender(school.identity.gender || '') === 'بنات').reduce(
      (sum, school) => sum + (typeof school.students.total === 'number' ? school.students.total : 0), 0
    ))

  const series: ApexAxisChartSeries = [
    { name: 'بنين', data: boysData },
    { name: 'بنات', data: girlsData }
  ]
  return series
})

function buildAuthorityStageGenderSeries(stageFilterFn: (stage: string) => boolean) {
  const stageAuthorities = Array.from(new Set(
    props.schools
      .filter(school => stageFilterFn(school.identity.stage))
      .map(school => school.identity.authority)
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, 'ar'))

  const boysData: number[] = []
  const girlsData: number[] = []

  for (const authority of stageAuthorities) {
    let boys = 0
    let girls = 0
    for (const school of props.schools) {
      if (school.identity.authority === authority && stageFilterFn(school.identity.stage)) {
        const gender = normalizeGender(school.identity.gender || '')
        const schoolCount = school.additional?.schoolCount || 1
        if (gender === 'بنين') {
          boys += schoolCount
        } else if (gender === 'بنات') {
          girls += schoolCount
        } else {
          boys += schoolCount / 2
          girls += schoolCount / 2
        }
      }
    }
    boysData.push(boys)
    girlsData.push(girls)
  }

  const series: ApexAxisChartSeries = [
    { name: 'بنين', data: boysData },
    { name: 'بنات', data: girlsData }
  ]
  return { authorities: stageAuthorities, series }
}

const primaryAuthorityStageGender = computed(() => buildAuthorityStageGenderSeries(stageFilters[0]!))
const middleAuthorityStageGender = computed(() => buildAuthorityStageGenderSeries(stageFilters[1]!))
const highAuthorityStageGender = computed(() => buildAuthorityStageGenderSeries(stageFilters[2]!))
const kindergartenAuthorityStageGender = computed(() => buildAuthorityStageGenderSeries(stageFilters[3]!))

function authorityStageGenderChartOptions(authorities: string[], series: ApexAxisChartSeries): ApexOptions {
  return {
    chart: {
      type: 'bar',
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '64%'
      }
    },
    colors: ['#2563eb', '#db2777'],
    xaxis: {
      categories: authorities.map((auth, idx) => {
        const boys = getSeriesValue(series, 0, idx)
        const girls = getSeriesValue(series, 1, idx)
        return `${auth}\nالإجمالي: ${formatNumber(boys + girls)}`
      }),
      title: { text: 'السلطة' }
    },
    yaxis: {
      title: { text: 'عدد المدارس' }
    },
    grid: { show: false },
    legend: {
      position: 'bottom',
      rtl: true,
      fontFamily
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatNumber(val)
    }
  } as unknown as ApexOptions
}

const primaryAuthorityStageGenderTotal = computed(() => {
  const data = primaryAuthorityStageGender.value
  return getSeriesTotal(data.series)
})

const primaryAuthorityStageGenderChart = computed<ApexOptions>(() =>
  authorityStageGenderChartOptions(primaryAuthorityStageGender.value.authorities, primaryAuthorityStageGender.value.series))

const middleAuthorityStageGenderTotal = computed(() => {
  const data = middleAuthorityStageGender.value
  return getSeriesTotal(data.series)
})

const middleAuthorityStageGenderChart = computed<ApexOptions>(() =>
  authorityStageGenderChartOptions(middleAuthorityStageGender.value.authorities, middleAuthorityStageGender.value.series))

const highAuthorityStageGenderTotal = computed(() => {
  const data = highAuthorityStageGender.value
  return getSeriesTotal(data.series)
})

const highAuthorityStageGenderChart = computed<ApexOptions>(() =>
  authorityStageGenderChartOptions(highAuthorityStageGender.value.authorities, highAuthorityStageGender.value.series))

const kindergartenAuthorityStageGenderTotal = computed(() => {
  const data = kindergartenAuthorityStageGender.value
  return getSeriesTotal(data.series)
})

const kindergartenAuthorityStageGenderChart = computed<ApexOptions>(() =>
  authorityStageGenderChartOptions(kindergartenAuthorityStageGender.value.authorities, kindergartenAuthorityStageGender.value.series))

const _departmentStaff = computed<DepartmentStaff[]>(() => {
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
    data: _departmentStaff.value.map(item => item.teachers)
  },
  {
    name: 'الإداريون',
    data: _departmentStaff.value.map(item => item.admins)
  }
])

const staffChartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false },
    stacked: true,
    background: isDark.value ? '#1e293b' : '#ffffff',
    theme: { mode: isDark.value ? 'dark' : 'light' },
    foreColor: isDark.value ? '#e2e8f0' : '#374151'
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '50%'
    }
  },
  colors: ['#16a34a', '#f97316'],
  xaxis: {
    categories: _departmentStaff.value.map(item => item.department),
    title: { text: 'إدارة التعليم' }
  },
  yaxis: {
    title: { text: 'عدد الكادر' }
  },
  grid: { show: false },
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val)
  }
}) as unknown as ApexOptions)

const authorities = computed(() => Array.from(new Set(props.schools.map(school => school.identity.authority).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')))

function buildAuthorityGenderSeries() {
  const stageAuthorities = authorities.value

  const boysData: number[] = []
  const girlsData: number[] = []

  for (const authority of stageAuthorities) {
    let boys = 0
    let girls = 0
    for (const school of props.schools) {
      if (school.identity.authority === authority) {
        const gender = normalizeGender(school.identity.gender || '')
        const schoolCount = school.additional?.schoolCount || 1
        if (gender === 'بنين') {
          boys += schoolCount
        } else if (gender === 'بنات') {
          girls += schoolCount
        } else {
          boys += schoolCount / 2
          girls += schoolCount / 2
        }
      }
    }
    boysData.push(boys)
    girlsData.push(girls)
  }

  const series: ApexAxisChartSeries = [
    { name: 'بنين', data: boysData },
    { name: 'بنات', data: girlsData }
  ]
  return { authorities: stageAuthorities, series }
}

const authorityGenderData = computed(() => buildAuthorityGenderSeries())
const authorityStageGenderSeries = computed<ApexAxisChartSeries>(() => authorityGenderData.value.series)

const authorityStageChart = computed<ApexOptions>(() => ({
  chart: {
    type: 'bar',
    fontFamily,
    toolbar: { show: false },
    stacked: true,
    background: isDark.value ? '#1e293b' : '#ffffff',
    theme: { mode: isDark.value ? 'dark' : 'light' },
    foreColor: isDark.value ? '#e2e8f0' : '#374151'
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '48%'
    }
  },
  colors: ['#2563eb', '#db2777'],
  xaxis: {
    categories: authorityGenderData.value.authorities.map((auth, idx) => {
      const boys = getSeriesValue(authorityGenderData.value.series, 0, idx)
      const girls = getSeriesValue(authorityGenderData.value.series, 1, idx)
      return `${auth}\nالإجمالي: ${formatNumber(boys + girls)}`
    }),
    title: { text: 'السلطة' }
  },
  yaxis: {
    title: { text: 'عدد المدارس' }
  },
  grid: { show: false },
  legend: {
    position: 'bottom',
    rtl: true,
    fontFamily
  },
  dataLabels: {
    enabled: true,
    style: { fontFamily, fontSize: '10px' },
    formatter: (val: number) => formatNumber(val)
  }
}) as unknown as ApexOptions)

const authorityStageGenderTotal = computed(() => getSeriesTotal(authorityGenderData.value.series))

const governorates = computed(() => Array.from(new Set(props.schools.map(s => s.additional?.governorate).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar')))

function buildGovernorateStageGenderSeries() {
  const stageGovernorates = governorates.value

  const boysData: number[] = []
  const girlsData: number[] = []

  for (const governorate of stageGovernorates) {
    let boys = 0
    let girls = 0
    for (const school of props.schools) {
      if (school.additional?.governorate === governorate) {
        const gender = normalizeGender(school.identity.gender || '')
        const schoolCount = school.additional?.schoolCount || 1
        if (gender === 'بنين') {
          boys += schoolCount
        } else if (gender === 'بنات') {
          girls += schoolCount
        } else {
          boys += schoolCount / 2
          girls += schoolCount / 2
        }
      }
    }
    boysData.push(boys)
    girlsData.push(girls)
  }

  return {
    governorates: stageGovernorates,
    boysData,
    girlsData
  }
}

const governorateStageGenderData = computed(() => buildGovernorateStageGenderSeries())

const governorateStageGenderSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'بنين', data: governorateStageGenderData.value.boysData },
  { name: 'بنات', data: governorateStageGenderData.value.girlsData }
])

const governorateStageGenderChart = computed<ApexOptions>(() => {
  const series = governorateStageGenderSeries.value
  return {
    chart: {
      type: 'bar',
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '48%'
      }
    },
    colors: ['#2563eb', '#db2777'],
    xaxis: {
      categories: governorateStageGenderData.value.governorates.map((label, index) => {
        const total = getSeriesValue(series, 0, index) + getSeriesValue(series, 1, index)
        return `${label}\nالإجمالي: ${formatNumber(total)}`
      }),
      title: { text: 'المحافظة' }
    },
    yaxis: {
      title: { text: 'عدد المدارس' }
    },
    grid: { show: false },
    legend: {
      position: 'bottom',
      rtl: true,
      fontFamily
    },
    dataLabels: {
      enabled: true,
      style: { fontFamily, fontSize: '10px' },
      formatter: (val: number) => formatNumber(val)
    }
  } as unknown as ApexOptions
})

const governorateStageGenderTotal = computed(() => getSeriesTotal(governorateStageGenderSeries.value))

// --- جلب قائمة المحافظات أو المناطق مع بديل في حال عدم وجود البيانات ---
const regionList = computed(() => {
  const regions = new Set<string>()
  for (const school of props.schools) {
    const region = school.additional?.governorate || school.identity.administrativeRegion || school.identity.educationDepartment || 'غير محدد'
    regions.add(region)
  }
  return Array.from(regions).sort((a, b) => a.localeCompare(b, 'ar'))
})

function buildRegionStaffGenderSeries() {
  const regions = regionList.value
  const boysData: number[] = []
  const girlsData: number[] = []

  for (const region of regions) {
    let boys = 0
    let girls = 0

    for (const school of props.schools) {
      const schoolRegion = school.additional?.governorate || school.identity.administrativeRegion || school.identity.educationDepartment || 'غير محدد'

      if (schoolRegion === region) {
        const gender = normalizeGender(school.identity.gender || '')
        const totalStaff = (typeof school.staff.teachers === 'number' ? school.staff.teachers : 0) +
                           (typeof school.staff.admins === 'number' ? school.staff.admins : 0)

        if (gender === 'بنين') {
          boys += totalStaff
        } else if (gender === 'بنات') {
          girls += totalStaff
        } else {
          boys += totalStaff / 2
          girls += totalStaff / 2
        }
      }
    }
    boysData.push(Math.round(boys))
    girlsData.push(Math.round(girls))
  }

  return { regions, boysData, girlsData }
}

const regionStaffGenderData = computed(() => buildRegionStaffGenderSeries())

const regionStaffGenderSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'بنين', data: regionStaffGenderData.value.boysData },
  { name: 'بنات', data: regionStaffGenderData.value.girlsData }
])

const regionStaffGenderTotal = computed(() => getSeriesTotal(regionStaffGenderSeries.value))

const regionStaffGenderChart = computed<ApexOptions>(() => {
  const series = regionStaffGenderSeries.value
  return {
    chart: {
      type: 'bar',
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: {
      bar: { borderRadius: 8, columnWidth: '48%' }
    },
    colors: ['#2563eb', '#db2777'],
    xaxis: {
      categories: regionStaffGenderData.value.regions.map((label, index) => {
        const total = getSeriesValue(series, 0, index) + getSeriesValue(series, 1, index)
        return `${label}\nالإجمالي: ${formatNumber(total)}`
      }),
      title: { text: 'المنطقة / المحافظة' }
    },
    yaxis: { title: { text: 'عدد الكادر التعليمي والإداري' } },
    grid: { show: false },
    legend: { position: 'bottom', rtl: true, fontFamily },
    dataLabels: { enabled: true, style: { fontFamily, fontSize: '10px' }, formatter: (val: number) => formatNumber(val) }
  } as unknown as ApexOptions
})

// --- المنطق الجديد: توافر المعامل حسب المنطقة والمحافظة (بنين / بنات) ---

// ألوان مخصصة لتمييز المعامل والجنس بوضوح (أزرق للكمبيوتر، أخضر للفيزياء، بنفسجي للكيمياء - الدرجة الداكنة للبنين والفاتحة للبنات)
const facilityGenderColors = ['#1e3a8a', '#3b82f6', '#14532d', '#22c55e', '#581c87', '#a855f7']

function buildFacilityChartOptions(categories: string[], titleX: string): ApexOptions {
  return {
    chart: {
      type: 'bar',
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    colors: facilityGenderColors,
    xaxis: {
      categories: categories,
      title: { text: titleX }
    },
    yaxis: { title: { text: 'عدد المعامل' } },
    grid: { show: false },
    legend: { position: 'bottom', rtl: true, fontFamily, fontSize: '11px', markers: { radius: 12 } },
    dataLabels: {
      enabled: true,
      style: { fontFamily, fontSize: '10px' },
      formatter: (val: number) => val > 0 ? formatNumber(val) : '' // لا نظهر الصفر لتفادي الفوضى في التراكم
    }
  } as unknown as ApexOptions
}

// 1. المعامل حسب المنطقة
const facilityRegionData = computed(() => {
  const grouped = new Map<string, FacilityData>()
  for (const school of props.schools) {
    const region = school.identity.administrativeRegion || school.identity.educationDepartment || 'غير محدد'
    const current = grouped.get(region) || { name: region, compBoys: 0, compGirls: 0, physBoys: 0, physGirls: 0, chemBoys: 0, chemGirls: 0, total: 0 }

    const gender = normalizeGender(school.identity.gender || '')
    const comp = school.facilities.computerLabs || 0
    const phys = school.facilities.physicsLabs || 0
    const chem = school.facilities.chemistryLabs || 0

    if (gender === 'بنين') {
      current.compBoys += comp; current.physBoys += phys; current.chemBoys += chem
    } else if (gender === 'بنات') {
      current.compGirls += comp; current.physGirls += phys; current.chemGirls += chem
    } else {
      current.compBoys += comp / 2; current.physBoys += phys / 2; current.chemBoys += chem / 2
      current.compGirls += comp / 2; current.physGirls += phys / 2; current.chemGirls += chem / 2
    }
    current.total += comp + phys + chem
    grouped.set(region, current)
  }
  return Array.from(grouped.values()).sort((a, b) => b.total - a.total).slice(0, 10)
})

const facilityRegionSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'كمبيوتر (بنين)', data: facilityRegionData.value.map(item => Math.round(item.compBoys)) },
  { name: 'كمبيوتر (بنات)', data: facilityRegionData.value.map(item => Math.round(item.compGirls)) },
  { name: 'فيزياء (بنين)', data: facilityRegionData.value.map(item => Math.round(item.physBoys)) },
  { name: 'فيزياء (بنات)', data: facilityRegionData.value.map(item => Math.round(item.physGirls)) },
  { name: 'كيمياء (بنين)', data: facilityRegionData.value.map(item => Math.round(item.chemBoys)) },
  { name: 'كيمياء (بنات)', data: facilityRegionData.value.map(item => Math.round(item.chemGirls)) }
])

const facilityRegionChart = computed<ApexOptions>(() => {
  const categories = facilityRegionData.value.map(item => `${item.name}\nإجمالي: ${formatNumber(item.total)}`)
  return buildFacilityChartOptions(categories, 'المنطقة')
})
const facilityRegionTotal = computed(() => getSeriesTotal(facilityRegionSeries.value))

// 2. المعامل حسب المحافظة
const facilityGovernorateData = computed(() => {
  const grouped = new Map<string, FacilityData>()
  for (const school of props.schools) {
    const gov = school.additional?.governorate || school.identity.administrativeRegion || 'غير محدد'
    const current = grouped.get(gov) || { name: gov, compBoys: 0, compGirls: 0, physBoys: 0, physGirls: 0, chemBoys: 0, chemGirls: 0, total: 0 }

    const gender = normalizeGender(school.identity.gender || '')
    const comp = school.facilities.computerLabs || 0
    const phys = school.facilities.physicsLabs || 0
    const chem = school.facilities.chemistryLabs || 0

    if (gender === 'بنين') {
      current.compBoys += comp; current.physBoys += phys; current.chemBoys += chem
    } else if (gender === 'بنات') {
      current.compGirls += comp; current.physGirls += phys; current.chemGirls += chem
    } else {
      current.compBoys += comp / 2; current.physBoys += phys / 2; current.chemBoys += chem / 2
      current.compGirls += comp / 2; current.physGirls += phys / 2; current.chemGirls += chem / 2
    }
    current.total += comp + phys + chem
    grouped.set(gov, current)
  }
  return Array.from(grouped.values()).sort((a, b) => b.total - a.total).slice(0, 10)
})

const facilityGovernorateSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'كمبيوتر (بنين)', data: facilityGovernorateData.value.map(item => Math.round(item.compBoys)) },
  { name: 'كمبيوتر (بنات)', data: facilityGovernorateData.value.map(item => Math.round(item.compGirls)) },
  { name: 'فيزياء (بنين)', data: facilityGovernorateData.value.map(item => Math.round(item.physBoys)) },
  { name: 'فيزياء (بنات)', data: facilityGovernorateData.value.map(item => Math.round(item.physGirls)) },
  { name: 'كيمياء (بنين)', data: facilityGovernorateData.value.map(item => Math.round(item.chemBoys)) },
  { name: 'كيمياء (بنات)', data: facilityGovernorateData.value.map(item => Math.round(item.chemGirls)) }
])

const facilityGovernorateChart = computed<ApexOptions>(() => {
  const categories = facilityGovernorateData.value.map(item => `${item.name}\nإجمالي: ${formatNumber(item.total)}`)
  return buildFacilityChartOptions(categories, 'المحافظة')
})
const facilityGovernorateTotal = computed(() => getSeriesTotal(facilityGovernorateSeries.value))

const stageStudentChart = computed<ApexOptions>(() => {
  return {
    chart: {
      type: 'bar',
      fontFamily,
      toolbar: { show: false },
      stacked: true,
      background: isDark.value ? '#1e293b' : '#ffffff',
      theme: { mode: isDark.value ? 'dark' : 'light' },
      foreColor: isDark.value ? '#e2e8f0' : '#374151'
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '30%'
      }
    },
    colors: ['#2563eb', '#db2777'],
    xaxis: {
      categories: stageLabels.map((label, index) => {
        const total = getSeriesValue(stageStudentGenderSeries.value, 0, index) + getSeriesValue(stageStudentGenderSeries.value, 1, index)
        return `${label}\nالإجمالي: ${formatNumber(total)}`
      }),
      title: { text: 'المراحل الدراسية' }
    },
    yaxis: {
      title: { text: 'عدد الطلاب' }
    },
    grid: { show: false },
    legend: {
      position: 'bottom',
      rtl: true,
      fontFamily
    },
    dataLabels: {
      enabled: true,
      style: {
        fontFamily,
        fontSize: '10px'
      },
      formatter: (val: number) => formatNumber(val)
    }
  } as unknown as ApexOptions
})

const chartKey = computed(() => Date.now())
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
              توزيع المراحل حسب الجنس
            </h2>
            <UIcon
              name="i-lucide-pie-chart"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          v-if="genderDistribution.length"
          :key="chartKey"
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
              الطلاب حسب المرحلة - بنين / بنات
            </h2>
            <UIcon
              name="i-lucide-users-round"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          v-if="stageStudentGenderSeries.length && stageStudentGenderSeries[0]?.data?.length"
          :key="chartKey"
          type="bar"
          :options="stageStudentChart"
          :series="stageStudentGenderSeries"
          height="320"
        />
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع المراحل حسب السلطة - بنين / بنات ({{ formatNumber(authorityStageGenderTotal) }})
          </h2>
          <UIcon
            name="i-lucide-layers-3"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        :key="chartKey"
        type="bar"
        :options="authorityStageChart"
        :series="authorityStageGenderSeries"
        height="320"
      />
    </UCard>

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard v-if="governorates.length">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المراحل حسب المحافظة - بنين / بنات ({{ formatNumber(governorateStageGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-map"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="governorateStageGenderChart"
          :series="governorateStageGenderSeries"
          height="320"
        />
      </UCard>

      <UCard v-if="governorates.length">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع الكادر التعليمي والإداري حسب المحافظة - بنين / بنات ({{ formatNumber(regionStaffGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-contact"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="regionStaffGenderChart"
          :series="regionStaffGenderSeries"
          height="320"
        />
      </UCard>
    </div>

    <UCard v-if="_departmentStaff.length">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-foreground">
            توزيع الكادر التعليمي والإداري لأعلى 10 إدارات تعليمية
          </h2>
          <UIcon
            name="i-lucide-contact-2"
            class="h-5 w-5 text-primary"
          />
        </div>
      </template>

      <ApexChart
        :key="chartKey"
        type="bar"
        :options="staffChartOptions"
        :series="staffSeries"
        height="320"
      />
    </UCard>

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المدارس حسب السلطة - الابتدائية - بنين / بنات ({{ formatNumber(primaryAuthorityStageGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-layers-3"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="primaryAuthorityStageGenderChart"
          :series="primaryAuthorityStageGender.series"
          height="320"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المدارس حسب السلطة - المتوسطة - بنين / بنات ({{ formatNumber(middleAuthorityStageGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-layers-3"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="middleAuthorityStageGenderChart"
          :series="middleAuthorityStageGender.series"
          height="320"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المدارس حسب السلطة - الثانوية - بنين / بنات ({{ formatNumber(highAuthorityStageGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-layers-3"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="highAuthorityStageGenderChart"
          :series="highAuthorityStageGender.series"
          height="320"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع المدارس حسب السلطة - رياض الأطفال - بنين / بنات ({{ formatNumber(kindergartenAuthorityStageGenderTotal) }})
            </h2>
            <UIcon
              name="i-lucide-layers-3"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="kindergartenAuthorityStageGenderChart"
          :series="kindergartenAuthorityStageGender.series"
          height="320"
        />
      </UCard>
    </div>

    <!-- البطاقات الجديدة للمعامل (المنطقة والمحافظة) -->
    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توافر المعامل حسب المنطقة - بنين / بنات ({{ formatNumber(facilityRegionTotal) }})
            </h2>
            <UIcon
              name="i-lucide-monitor-check"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="facilityRegionChart"
          :series="facilityRegionSeries"
          height="320"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توافر المعامل حسب المحافظة - بنين / بنات ({{ formatNumber(facilityGovernorateTotal) }})
            </h2>
            <UIcon
              name="i-lucide-map-pin"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="facilityGovernorateChart"
          :series="facilityGovernorateSeries"
          height="320"
        />
      </UCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع الطلاب حسب الصفوف - المرحلة الابتدائية
            </h2>
            <UIcon
              name="i-lucide-chart-column"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="primaryGradeChart"
          :series="primaryGradeSeries"
          height="300"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع الطلاب حسب الصفوف - المرحلة المتوسطة
            </h2>
            <UIcon
              name="i-lucide-chart-column"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="middleGradeChart"
          :series="middleGradeSeries"
          height="300"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع الطلاب حسب الصفوف - المرحلة الثانوية
            </h2>
            <UIcon
              name="i-lucide-chart-column"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="highGradeChart"
          :series="highGradeSeries"
          height="300"
        />
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">
              توزيع الطلاب حسب الصفوف - رياض الأطفال
            </h2>
            <UIcon
              name="i-lucide-chart-column"
              class="h-5 w-5 text-primary"
            />
          </div>
        </template>

        <ApexChart
          :key="chartKey"
          type="bar"
          :options="kindergartenChart"
          :series="kindergartenSeries"
          height="300"
        />
      </UCard>
    </div>
  </section>
</template>
