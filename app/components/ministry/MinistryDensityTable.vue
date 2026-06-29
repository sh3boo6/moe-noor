<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import * as XLSX from 'xlsx'

interface DensityRecord {
  ministryId: string
  schoolName: string
  stage: string
  students: number
  classes: number
  density: number
  stageAvgDensity: number
}

interface Props {
  schools: MinistrySchoolRecord[]
}

const props = defineProps<Props>()

const selectedFilter = ref<'all' | 'high' | 'low'>('all')
const search = ref('')
const page = ref(1)
const pageSize = ref(5)
const sortField = ref<'density' | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')
const excludeZeroDensity = ref(true) // تحكم باستبعاد الكثافة الصفرية

const numberFormatter = new Intl.NumberFormat('ar')

function convertArabicNumbers(str: string): string {
  const arabicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  }
  return str.replace(/[٠-٩]/g, match => arabicDigits[match] || match)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'غير محدد'
  }
  if (typeof value === 'number') {
    return numberFormatter.format(value)
  }
  return String(value)
}

const densityData = computed<DensityRecord[]>(() => {
  const stageAvgDensity = new Map<string, number>()

  props.schools.forEach((school) => {
    const stage = school.identity.stage || 'غير محدد'
    if (!stageAvgDensity.has(stage)) {
      const stageRecords = props.schools.filter(s => s.identity.stage === stage)
      const totalStudents = stageRecords.reduce((sum, s) => sum + (s.students.total || 0), 0)
      const totalClasses = stageRecords.reduce((sum, s) => sum + (s.students.classes || 0), 0)
      stageAvgDensity.set(stage, totalClasses > 0 ? totalStudents / totalClasses : 0)
    }
  })

  return props.schools.map(school => ({
    ministryId: school.identity.id,
    schoolName: school.identity.schoolName,
    stage: school.identity.stage,
    students: school.students.total || 0,
    classes: school.students.classes || 0,
    density: (school.students.classes || 0) > 0 ? (school.students.total || 0) / (school.students.classes || 0) : 0,
    stageAvgDensity: stageAvgDensity.get(school.identity.stage || 'غير محدد') || 0
  }))
})

const filteredData = computed(() => {
  const keyword = search.value.toLocaleLowerCase('ar')

  let data = [...densityData.value]

  // تطبيق فلترة الكثافة الصفرية
  if (excludeZeroDensity.value) {
    data = data.filter(d => d.density > 0)
  }

  if (selectedFilter.value === 'high') {
    data = data.filter(d => d.density >= 35)
  } else if (selectedFilter.value === 'low') {
    data = data.filter(d => d.density <= 15)
  }

  if (keyword) {
    data = data.filter(d =>
      d.ministryId.toLocaleLowerCase('ar').includes(keyword)
      || d.schoolName.toLocaleLowerCase('ar').includes(keyword)
      || d.stage.toLocaleLowerCase('ar').includes(keyword)
    )
  }

  return data
})

const sortedData = computed(() => {
  const data = [...filteredData.value]

  if (sortField.value === 'density') {
    data.sort((a, b) => sortOrder.value === 'asc' ? a.density - b.density : b.density - a.density)
  }

  return data
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedData.value.length / pageSize.value)))
const paginatedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() => sortedData.value.length ? (page.value - 1) * pageSize.value + 1 : 0)
const pageEnd = computed(() => Math.min(page.value * pageSize.value, sortedData.value.length))

watch(totalPages, (value) => {
  if (page.value > value) {
    page.value = value
  }
})

watch(search, (newValue) => {
  const normalized = convertArabicNumbers(newValue)
  if (newValue !== normalized) {
    search.value = normalized
  }
  page.value = 1
})

watch(selectedFilter, () => {
  page.value = 1
})

watch(sortField, () => {
  page.value = 1
})

watch(sortOrder, () => {
  page.value = 1
})

function goToPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value)
}

function toggleSort() {
  if (sortField.value !== 'density') {
    sortField.value = 'density'
    sortOrder.value = 'desc'
  } else {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
}

function getDensityColor(density: number): string {
  if (density > 35) {
    return 'text-red-600 dark:text-red-400'
  }
  if (density < 15) {
    return 'text-green-600 dark:text-green-400'
  }
  return 'text-foreground'
}

function getDensityBadge(density: number): { label: string, class: string } {
  if (density > 35) {
    return { label: 'عالي', class: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' }
  }
  if (density < 15) {
    return { label: 'منخفض', class: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' }
  }
  return { label: 'متوسط', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' }
}

function exportToXLSX() {
  const exportData = sortedData.value.map(s => ({
    'الرقم الوزاري': s.ministryId,
    'اسم المدرسة': s.schoolName,
    'المرحلة': s.stage,
    'عدد الطلاب': s.students,
    'عدد الفصول': s.classes,
    'الكثافة': Number(s.density.toFixed(2))
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'كثافة الطلاب حسب المرحلة')

  const headers = ['الرقم الوزاري', 'اسم المدرسة', 'المرحلة', 'عدد الطلاب', 'عدد الفصول', 'الكثافة']
  for (let C = 0; C < headers.length; C++) {
    const addr = { c: C, r: 0 }
    const cellRef = XLSX.utils.encode_cell(addr)
    if (!worksheet[cellRef]) continue
    worksheet[cellRef].v = headers[C]
  }

  const colWidths = [150, 250, 150, 120, 120, 100]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `كثافة_الطلاب_حسب_المرحلة_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard dir="rtl">
    <template #header>
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            كثافة الطلاب حسب المرحلة الدراسية
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            يتم حساب الكثافة كعدد الطلاب ÷ عدد الفصول. اضغط على عمود الكثافة للترتيب.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <USelect
            v-model="selectedFilter"
            :items="[
              { label: 'جميع المراحل', value: 'all' },
              { label: '٣٥ فأكثر', value: 'high' },
              { label: '١٥ فأقل', value: 'low' }
            ]"
            value-key="value"
            label-key="label"
            class="w-full sm:w-48"
          />

          <UInput
            v-model="search"
            class="w-full sm:w-72"
            placeholder="ابحث برقم الوزاري أو اسم المدرسة أو المرحلة"
            icon="i-lucide-search"
          />

          <UButton
            size="sm"
            :color="excludeZeroDensity ? 'primary' : 'neutral'"
            variant="ghost"
            :label="excludeZeroDensity ? 'إظهار الكثافة الصفرية' : 'استبعاد الكثافة الصفرية'"
            @click="excludeZeroDensity = !excludeZeroDensity"
          />
        </div>
      </div>
    </template>

    <div class="overflow-x-auto rounded-2xl border border-accented/50">
      <table class="w-full min-w-max border-collapse text-right text-sm">
        <thead class="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[150px]">
              الرقم الوزاري
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[250px]">
              اسم المدرسة
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[150px]">
              المرحلة الدراسية
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[120px]">
              عدد الطلاب
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[120px]">
              عدد الفصول
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[100px]">
              <button
                type="button"
                class="flex items-center gap-1 hover:text-primary transition-colors"
                @click="toggleSort"
              >
                الكثافة
                <UIcon
                  v-if="sortField === 'density'"
                  :name="sortOrder === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'"
                  class="h-3 w-3"
                />
                <UIcon
                  v-else
                  name="i-lucide-arrow-up-narrow-wide"
                  class="h-3 w-3 opacity-30"
                />
              </button>
            </th>
            <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold min-w-[100px]">
              التصنيف
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-border bg-card">
          <tr
            v-for="record in paginatedData"
            :key="`${record.ministryId}-${record.schoolName}`"
            class="transition-colors hover:bg-muted/40"
          >
            <td class="whitespace-nowrap px-4 py-3 text-foreground font-medium">
              {{ record.ministryId }}
            </td>

            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ record.schoolName }}
            </td>

            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ record.stage }}
            </td>

            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ formatValue(record.students) }}
            </td>

            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ formatValue(record.classes) }}
            </td>

            <td
              class="whitespace-nowrap px-4 py-3 font-semibold"
              :class="getDensityColor(record.density)"
            >
              {{ Number(record.density.toFixed(2)) }}
            </td>

            <td class="whitespace-nowrap px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="getDensityBadge(record.density).class"
              >
                {{ getDensityBadge(record.density).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!paginatedData.length"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <UIcon
        name="i-lucide-database-zap"
        class="mb-3 h-10 w-10 text-muted"
      />
      <p class="text-sm font-medium text-foreground">
        لا توجد نتائج مطابقة
      </p>
      <p class="mt-1 text-sm text-muted-foreground">
        جرّب تغيير البحث أو الفلاتر.
      </p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div class="text-sm text-muted-foreground">
            عرض {{ pageStart }} - {{ pageEnd }} من {{ sortedData.length }} سجل
          </div>

          <UButton
            size="xs"
            color="primary"
            variant="outline"
            label="تصدير XLSX"
            icon="i-lucide-file-spreadsheet"
            :disabled="!sortedData.length"
            @click="exportToXLSX"
          />
        </div>

        <div class="flex items-center justify-between gap-2">
          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            الصفوف
            <select
              v-model.number="pageSize"
              class="rounded-xl border border-accented/50 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="15">15</option>
              <option :value="25">25</option>
            </select>
          </label>

          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="السابق"
              :disabled="page === 1"
              @click="goToPage(page - 1)"
            />

            <span class="min-w-20 text-center text-sm text-foreground">
              صفحة {{ page }} من {{ totalPages }}
            </span>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="التالي"
              :disabled="page === totalPages"
              @click="goToPage(page + 1)"
            />
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
