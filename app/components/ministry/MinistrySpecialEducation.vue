<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import {
  SPECIAL_EDUCATION_CATEGORIES,
  SPECIAL_EDUCATION_PROGRAMS,
  SPECIAL_EDUCATION_TOTAL
} from '~/composables/useSpecialEducation'

interface MetricCard {
  key: string
  label: string
  value: string
  description?: string
  icon?: string
}

const props = defineProps<{
  schools: MinistrySchoolRecord[]
}>()

const schoolsRef = toRef(props, 'schools')
const {
  records,
  fileName,
  loading,
  error,
  matched,
  matchedRows,
  totals,
  schoolsWithStudents,
  parseFile,
  clear
} = useSpecialEducation(schoolsRef)

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const formatter = new Intl.NumberFormat('en-US')

function format(value: number | undefined): string {
  return formatter.format(value ?? 0)
}

function text(value: string): string {
  return value || 'غير محدد'
}

async function handleFiles(files: FileList | null | undefined) {
  const file = files?.[0]

  if (file) {
    await parseFile(file)
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  await handleFiles(input.files)
  input.value = ''
}

async function onDrop(files: FileList | null | undefined) {
  isDragging.value = false
  await handleFiles(files)
}

const summaryCards = computed<MetricCard[]>(() => [
  {
    key: SPECIAL_EDUCATION_TOTAL.key,
    label: 'مدارس لديها طلاب إعاقة',
    value: format(schoolsWithStudents.value),
    description: `من ${format(matched.value.length)} مدرسة مطابقة في الملف`,
    icon: 'i-lucide-school'
  },
  {
    key: SPECIAL_EDUCATION_TOTAL.key,
    label: SPECIAL_EDUCATION_TOTAL.label,
    value: format(totals.value[SPECIAL_EDUCATION_TOTAL.key]),
    description: 'إجمالي الطلاب حسب الفلاتر الحالية',
    icon: 'i-lucide-accessibility'
  }
])

const categoryCards = computed<MetricCard[]>(() =>
  SPECIAL_EDUCATION_CATEGORIES.map(metric => ({
    key: metric.key,
    label: metric.label,
    value: format(totals.value[metric.key])
  }))
)

const programCards = computed<MetricCard[]>(() =>
  SPECIAL_EDUCATION_PROGRAMS.map(metric => ({
    key: metric.key,
    label: metric.label,
    value: format(totals.value[metric.key])
  }))
)

// ─── مودال استعراض المدارس لكل بطاقة ─────────────────────────────────────────
const showModal = ref(false)
const selected = ref<{ key: string, label: string } | null>(null)
const modalSearch = ref('')
const modalPage = ref(1)
const modalPageSize = ref(15)

function openModal(card: MetricCard) {
  selected.value = { key: card.key, label: card.label }
  modalSearch.value = ''
  modalPage.value = 1
  showModal.value = true
}

const modalRows = computed(() => {
  const key = selected.value?.key

  if (!key) {
    return []
  }

  const keyword = modalSearch.value.toLocaleLowerCase('ar')

  return matchedRows.value
    .map(row => ({ school: row.school, count: row.record.values[key] ?? 0 }))
    .filter(row => row.count > 0)
    .filter((row) => {
      if (!keyword) {
        return true
      }

      return [
        row.school.identity.schoolName,
        row.school.identity.id,
        row.school.identity.educationDepartment,
        row.school.identity.stage
      ].join(' ').toLocaleLowerCase('ar').includes(keyword)
    })
    .sort((a, b) => b.count - a.count)
})

const modalTotal = computed(() => modalRows.value.reduce((sum, row) => sum + row.count, 0))
const totalModalPages = computed(() => Math.max(1, Math.ceil(modalRows.value.length / modalPageSize.value)))
const paginatedModalRows = computed(() => {
  const start = (modalPage.value - 1) * modalPageSize.value
  return modalRows.value.slice(start, start + modalPageSize.value)
})
const modalPageStart = computed(() => modalRows.value.length ? (modalPage.value - 1) * modalPageSize.value + 1 : 0)
const modalPageEnd = computed(() => Math.min(modalPage.value * modalPageSize.value, modalRows.value.length))

watch(totalModalPages, (value) => {
  if (modalPage.value > value) {
    modalPage.value = value
  }
})

watch([modalSearch, modalPageSize], () => {
  modalPage.value = 1
})

function goToModalPage(next: number) {
  modalPage.value = Math.min(Math.max(next, 1), totalModalPages.value)
}

async function exportModalToExcel() {
  const XLSX = await import('xlsx')
  const label = selected.value?.label ?? ''
  const headers = ['الرقم الوزاري', 'اسم المدرسة', 'إدارة التعليم', 'المرحلة', 'جنس المدرسة', label]
  const rows = modalRows.value.map(row => [
    text(row.school.identity.id),
    text(row.school.identity.schoolName),
    text(row.school.identity.educationDepartment),
    text(row.school.identity.stage),
    text(row.school.identity.gender),
    row.count
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المدارس')
  XLSX.writeFile(workbook, `التربية-الخاصة-${label}-${new Date().toISOString().split('T')[0]}.xlsx`)
}
</script>

<template>
  <UCard dir="rtl">
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            التربية الخاصة
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            بيانات الملف مرتبطة بالرقم الوزاري وتتأثر بالفلاتر.
          </p>
        </div>

        <div
          v-if="records.length"
          class="flex items-center gap-2"
        >
          <span class="max-w-60 truncate text-xs text-muted-foreground">{{ fileName }}</span>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="إزالة الملف"
            @click="clear"
          />
        </div>
      </div>
    </template>

    <section
      v-if="!records.length"
      class="rounded-2xl border border-dashed border-primary/40 p-6 text-center transition-colors"
      :class="isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/70'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop($event.dataTransfer?.files)"
    >
      <input
        ref="inputRef"
        type="file"
        class="hidden"
        accept=".xlsx,.xls,.xlsm,.csv"
        @change="onFileChange"
      >

      <p class="text-sm text-muted-foreground">
        ارفع ملف التربية الخاصة (يحتوي عمود «الرقم الاحصائي») أو أفلته هنا.
      </p>

      <UButton
        class="mt-4"
        type="button"
        icon="i-lucide-upload-cloud"
        label="اختيار ملف التربية الخاصة"
        :loading="loading"
        @click="inputRef?.click()"
      />

      <UAlert
        v-if="error"
        class="mt-4 text-right"
        color="error"
        variant="subtle"
        title="تعذر قراءة الملف"
        :description="error"
      />
    </section>

    <div
      v-else
      class="flex flex-col gap-5"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-2xl border border-accented/50 bg-muted/20 p-4"
        >
          <div class="flex items-center justify-between text-sm text-muted-foreground">
            <span>{{ card.label }}</span>
            <UIcon
              :name="card.icon ?? 'i-lucide-school'"
              class="h-5 w-5 text-primary"
            />
          </div>
          <p class="mt-2 text-3xl font-semibold text-foreground">
            {{ card.value }}
          </p>
          <div class="mt-1 flex items-center justify-between gap-2">
            <p class="text-xs text-muted-foreground">
              {{ card.description }}
            </p>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="عرض"
              icon="i-lucide-table-2"
              @click="openModal(card)"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-foreground">
          حسب فئة الإعاقة
        </h3>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="card in categoryCards"
            :key="card.key"
            class="rounded-2xl border border-accented/50 bg-card p-4"
          >
            <p class="text-xs text-muted-foreground">
              {{ card.label }}
            </p>
            <div class="mt-1 flex items-center justify-between gap-2">
              <p class="text-2xl font-semibold text-foreground">
                {{ card.value }}
              </p>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                label="عرض"
                icon="i-lucide-table-2"
                @click="openModal(card)"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-foreground">
          البرامج حسب الجنس
        </h3>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="card in programCards"
            :key="card.key"
            class="rounded-2xl border border-accented/50 bg-card p-4"
          >
            <p class="text-xs text-muted-foreground">
              {{ card.label }}
            </p>
            <div class="mt-1 flex items-center justify-between gap-2">
              <p class="text-2xl font-semibold text-foreground">
                {{ card.value }}
              </p>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                label="عرض"
                icon="i-lucide-table-2"
                @click="openModal(card)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="showModal"
      fullscreen
      :title="selected?.label"
    >
      <template #header>
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="flex items-center gap-3 text-lg font-semibold text-foreground">
            <span>{{ selected?.label }}</span>
            <sup class="font-bold text-primary">{{ modalRows.length }}</sup>
          </h3>
          <UInput
            v-model="modalSearch"
            class="w-full sm:w-80"
            placeholder="ابحث باسم المدرسة أو الرقم الوزاري أو الإدارة"
            icon="i-lucide-search"
          />
          <UButton
            icon="i-lucide:x"
            variant="ghost"
            class="ms-auto"
            color="neutral"
            size="xl"
            @click="showModal = false;"
          />
        </div>
      </template>

      <template #body>
        <div class="overflow-x-auto rounded-2xl border border-accented/50">
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
                  إدارة التعليم
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  المرحلة
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  جنس المدرسة
                </th>
                <th class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold">
                  {{ selected?.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border bg-card">
              <tr
                v-for="row in paginatedModalRows"
                :key="row.school.sourceRow"
                class="transition-colors hover:bg-muted/40"
              >
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ text(row.school.identity.id) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ text(row.school.identity.schoolName) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ text(row.school.identity.educationDepartment) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ text(row.school.identity.stage) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-foreground">
                  {{ text(row.school.identity.gender) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 font-semibold text-primary">
                  {{ format(row.count) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="!paginatedModalRows.length"
            class="py-12 text-center text-sm text-muted-foreground"
          >
            لا توجد مدارس مطابقة
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-3 px-2 text-xs">
          <span class="text-primary">الإجمالي:</span>
          <strong>{{ format(modalTotal) }}</strong>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            icon="i-lucide-file-spreadsheet"
            label="تصدير Excel"
            color="primary"
            size="sm"
            :disabled="!modalRows.length"
            @click="exportModalToExcel"
          />

          <div class="text-sm text-muted-foreground">
            عرض {{ modalPageStart }} - {{ modalPageEnd }} من {{ modalRows.length }} سجل
          </div>

          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm text-muted-foreground">
              الصفوف
              <select
                v-model.number="modalPageSize"
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

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="السابق"
              :disabled="modalPage === 1"
              @click="goToModalPage(modalPage - 1)"
            />
            <span class="min-w-20 text-center text-sm text-foreground">
              صفحة {{ modalPage }} من {{ totalModalPages }}
            </span>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              label="التالي"
              :disabled="modalPage === totalModalPages"
              @click="goToModalPage(modalPage + 1)"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
