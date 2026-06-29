<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

interface TableColumn {
  key: string
  label: string
  width?: string
  getValue: (school: MinistrySchoolRecord) => unknown
}

const props = defineProps<{
  schools: MinistrySchoolRecord[]
}>()

const emit = defineEmits<{
  'open-details': [school: MinistrySchoolRecord]
}>()

const numberFormatter = new Intl.NumberFormat('ar')
const search = ref('')
const page = ref(1)
const pageSize = ref(5)

const defaultColumns: TableColumn[] = [
  { key: 'identity.id', label: 'الرقم الوزاري', width: 'min-w-[130px]', getValue: s => s.identity.id },
  { key: 'identity.schoolName', label: 'اسم المدرسة', width: 'min-w-[220px]', getValue: s => s.identity.schoolName },
  { key: 'identity.educationDepartment', label: 'إدارة التعليم', width: 'min-w-[180px]', getValue: s => s.identity.educationDepartment },
  { key: 'identity.administrativeRegion', label: 'المنطقة الإدارية', width: 'min-w-[160px]', getValue: s => s.identity.administrativeRegion },
  { key: 'identity.mailAddress', label: 'المحافظة', width: 'min-w-[140px]', getValue: s => s.identity.mailAddress },
  { key: 'identity.stage', label: 'المرحلة الدراسية', width: 'min-w-[130px]', getValue: s => s.identity.stage },
  { key: 'identity.gender', label: 'جنس المدرسة', width: 'min-w-[120px]', getValue: s => s.identity.gender },
  { key: 'identity.authority', label: 'السلطة', width: 'min-w-[110px]', getValue: s => s.identity.authority },
  { key: 'identity.studyTime', label: 'وقت الدراسة', width: 'min-w-[120px]', getValue: s => s.identity.studyTime },
  { key: 'students.total', label: 'جملة طلاب', width: 'min-w-[110px]', getValue: s => s.students.total },
  { key: 'students.classes', label: 'الفصول', width: 'min-w-[100px]', getValue: s => s.students.classes },
  { key: 'staff.teachers', label: 'المعلمين', width: 'min-w-[100px]', getValue: s => s.staff.teachers },
  { key: 'staff.managerName', label: 'المدير', width: 'min-w-[160px]', getValue: s => s.staff.managerName },
  { key: 'staff.managerId', label: 'هوية المدير', width: 'min-w-[140px]', getValue: s => s.staff.managerId }, // العمود الجديد
  { key: 'building.ownership', label: 'ملكية المبنى', width: 'min-w-[120px]', getValue: s => s.building.ownership }
]

const visibleColumnKeys = ref<string[]>(defaultColumns.map(c => c.key))

const filteredRows = computed(() => {
  const keyword = search.value.toLocaleLowerCase('ar')

  if (!keyword) {
    return props.schools
  }

  return props.schools.filter((school) => {
    // تم إضافة اسم المدير ورقم هويته هنا لتمكين البحث من خلالهما
    const searchableText = [
      school.identity.schoolName,
      school.identity.id,
      school.identity.educationDepartment,
      school.identity.mailAddress,
      school.staff.managerName,
      school.staff.managerId
    ].join(' ').toLocaleLowerCase('ar')

    return searchableText.includes(keyword)
  })
})

const visibleColumns = computed(() => defaultColumns.filter(column => visibleColumnKeys.value.includes(column.key)))

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize.value + 1 : 0)
const pageEnd = computed(() => Math.min(page.value * pageSize.value, filteredRows.value.length))

watch(totalPages, (value) => {
  if (page.value > value) {
    page.value = value
  }
})

// دالة تحويل الأرقام الشرقية (٠-٩) إلى غربية (0-9)
function convertArabicNumbers(str: string): string {
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g]
  for (const [i, regex] of arabicNumbers.entries()) {
    str = str.replace(regex, String(i))
  }
  return str
}

// مراقبة حقل البحث وتحويل القيم فوراً مع إعادة الصفحة للأولى
watch(search, (newValue) => {
  const normalized = convertArabicNumbers(newValue)
  if (newValue !== normalized) {
    search.value = normalized
  }
  page.value = 1
})

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'غير محدد'
  }

  if (typeof value === 'number') {
    return numberFormatter.format(value)
  }

  return String(value)
}

function toggleColumn(key: string, checked: boolean) {
  if (checked && !visibleColumnKeys.value.includes(key)) {
    visibleColumnKeys.value.push(key)
    return
  }

  visibleColumnKeys.value = visibleColumnKeys.value.filter(item => item !== key)
}

function goToPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value)
}

function openDetails(school: MinistrySchoolRecord) {
  emit('open-details', school)
}
</script>

<template>
  <UCard dir="rtl">
    <template #header>
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            جدول المدارس حسب المراحل الدراسية
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            بحث سريع، تصفية، وتنقل بين الصفحات. اضغط على الصف لفتح التفاصيل.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="search"
            class="w-full sm:w-80"
            placeholder="ابحث باسم المدرسة، المدير، الهوية أو الرقم الوزاري"
            icon="i-lucide-search"
          />
        </div>
      </div>
    </template>

    <details class="mb-4 rounded-2xl border border-accented/50 bg-muted/20 p-4">
      <summary class="cursor-pointer text-sm font-semibold text-foreground">
        إظهار/إخفاء الأعمدة
      </summary>

      <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <label
          v-for="column in defaultColumns"
          :key="column.key"
          class="flex items-center gap-2 rounded-xl border border-accented/50 bg-card px-3 py-2 text-sm text-muted-foreground"
        >
          <input
            :checked="visibleColumnKeys.includes(column.key)"
            type="checkbox"
            class="h-4 w-4 accent-primary"
            @change="toggleColumn(column.key, ($event.target as HTMLInputElement).checked)"
          >
          <span class="truncate">{{ column.label }}</span>
        </label>
      </div>
    </details>

    <div class="overflow-x-auto rounded-2xl border border-accented/50">
      <table class="w-full min-w-max border-collapse text-right text-sm">
        <thead class="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              class="whitespace-nowrap border-b border-accented/50 bg-card px-4 py-3 font-semibold"
              :class="column.width"
            >
              {{ column.label }}
            </th>
            <th class="sticky left-0 z-10 bg-default min-w-3 border-b border-accented/50 bg-card px-4 py-3 text-left">
              الإجراءات
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-border bg-card">
          <tr
            v-for="school in paginatedRows"
            :key="`row-${school.identity.id}-${school.identity.schoolName}`"
            class="transition-colors hover:bg-muted/40 cursor-pointer"
            @click="openDetails(school)"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              class="whitespace-nowrap px-4 py-3 text-foreground"
              :class="column.width"
            >
              {{ formatValue(column.getValue(school)) }}
            </td>

            <td
              class="sticky left-0 z-10 bg-default min-w-3 border-r border-accented/50 bg-card px-4 py-3 text-left"
              @click.stop
            >
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                label="التفاصيل"
                @click="openDetails(school)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="!paginatedRows.length"
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
        <div class="text-sm text-muted-foreground">
          عرض {{ pageStart }} - {{ pageEnd }} من {{ filteredRows.length }} سجل
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
