<script setup lang="ts">
import type { SchoolRecord } from '~/types/school'

const props = defineProps<{
  schools: SchoolRecord[]
}>()

const numberFormatter = new Intl.NumberFormat('ar')
const search = ref('')
const governorate = ref<string[]>([])
const stage = ref<string[]>([])
const gender = ref<string[]>([])
const studyTime = ref<string[]>([])
const page = ref(1)
const pageSize = ref(10)

// تعيد القيم الفريدة من عمود محدد لتستخدم كخيارات فلاتر.
function uniqueValues(field: keyof Pick<SchoolRecord, 'governorate' | 'stage' | 'gender' | 'studyTime'>): string[] {
  return Array.from(new Set(props.schools.map(school => school[field]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'ar'))
}

const governorateOptions = computed(() => uniqueValues('governorate'))
const stageOptions = computed(() => uniqueValues('stage'))
const genderOptions = computed(() => uniqueValues('gender'))
const studyTimeOptions = computed(() => uniqueValues('studyTime'))

// تعيد تصفية البيانات بناء على البحث والفلاتر الجانبية.
const filteredRows = computed(() => {
  const keyword = search.value.toLocaleLowerCase('ar')

  return props.schools.filter((school) => {
    const searchableText = `${school.schoolName} ${school.id} ${school.managerName}`.toLocaleLowerCase('ar')
    const matchesSearch = !keyword || searchableText.includes(keyword)
    const matchesGovernorate = !governorate.value.length || governorate.value.includes(school.governorate)
    const matchesStage = !stage.value.length || stage.value.includes(school.stage)
    const matchesGender = !gender.value.length || gender.value.includes(school.gender)
    const matchesStudyTime = !studyTime.value.length || studyTime.value.includes(school.studyTime)

    return matchesSearch && matchesGovernorate && matchesStage && matchesGender && matchesStudyTime
  })
})

// يعيد ترتيب الصفحة إلى الأولى عند تغيير أي فلتر أو نص بحث.
watch([search, governorate, stage, gender, studyTime], () => {
  page.value = 1
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))

watch(totalPages, (value) => {
  if (page.value > value) {
    page.value = value
  }
})

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize.value + 1 : 0)
const pageEnd = computed(() => Math.min(page.value * pageSize.value, filteredRows.value.length))

// تنقل آمن بين الصفحات حتى عند الوصول إلى أول أو آخر صفحة.
function goToPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value)
}

function resetFilters() {
  search.value = ''
  governorate.value = []
  stage.value = []
  gender.value = []
  studyTime.value = []
  page.value = 1
}

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}
</script>

<template>
  <UCard dir="rtl">
    <template #header>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            جدول بيانات المدارس
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            اعرض {{ filteredRows.length }} سجل من أصل {{ schools.length }} سجل
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="search"
            class="w-full sm:w-72"
            placeholder="ابحث باسم المدرسة أو الرقم الوزاري أو المدير"
            icon="i-lucide-search"
          />

          <UButton
            color="neutral"
            variant="ghost"
            label="إعادة الفلاتر"
            icon="i-lucide-rotate-ccw"
            @click="resetFilters"
          />
        </div>
      </div>
    </template>

    <div class="grid gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="flex flex-col gap-2 text-sm font-medium text-foreground">
        المحافظة
        <USelectMenu
          v-model="governorate"
          :items="governorateOptions"
          placeholder="كل المحافظات"
          multiple
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2 text-sm font-medium text-foreground">
        المرحلة
        <USelectMenu
          v-model="stage"
          :items="stageOptions"
          placeholder="كل المراحل"
          multiple
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2 text-sm font-medium text-foreground">
        جنس المدرسة
        <USelectMenu
          v-model="gender"
          :items="genderOptions"
          placeholder="كل الأجناس"
          multiple
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2 text-sm font-medium text-foreground">
        وقت الدراسة
        <USelectMenu
          v-model="studyTime"
          :items="studyTimeOptions"
          placeholder="كل الأوقات"
          multiple
          class="w-full"
        />
      </div>
    </div>

    <div class="mt-5 overflow-x-auto rounded-2xl border border-border/50">
      <table class="w-full min-w-[900px] border-collapse text-right text-sm">
        <thead class="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th class="px-4 py-3 font-semibold">
              الرقم الوزاري
            </th>
            <th class="px-4 py-3 font-semibold">
              اسم المدرسة
            </th>
            <th class="px-4 py-3 font-semibold">
              المحافظة
            </th>
            <th class="px-4 py-3 font-semibold">
              المرحلة
            </th>
            <th class="px-4 py-3 font-semibold">
              الجنس
            </th>
            <th class="px-4 py-3 font-semibold">
              السلطة
            </th>
            <th class="px-4 py-3 font-semibold">
              نوع التعليم
            </th>
            <th class="px-4 py-3 font-semibold">
              ملكية المبنى
            </th>
            <th class="px-4 py-3 font-semibold">
              وقت الدراسة
            </th>
            <th class="px-4 py-3 font-semibold">
              الفصول
            </th>
            <th class="px-4 py-3 font-semibold">
              الطلاب
            </th>
            <th class="px-4 py-3 font-semibold">
              المدير
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-border bg-card">
          <tr
            v-for="school in paginatedRows"
            :key="`${school.sourceRow}-${school.schoolName}`"
            class="transition-colors hover:bg-muted/40"
          >
            <td class="whitespace-nowrap px-4 py-3 font-medium text-foreground">
              {{ school.id || 'غير محدد' }}
            </td>
            <td class="max-w-[240px] px-4 py-3 font-medium text-foreground">
              {{ school.schoolName || 'غير محدد' }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.governorate || 'غير محدد' }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.stage || 'غير محدد' }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                v-if="school.gender"
                size="xs"
                color="neutral"
                variant="subtle"
              >
                {{ school.gender }}
              </UBadge>
              <span
                v-else
                class="text-muted-foreground"
              >غير محدد</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.authority || 'غير محدد' }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.educationType || 'غير محدد' }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.buildingOwnership || 'غير محدد' }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.studyTime || 'غير محدد' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ formatNumber(school.classes) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-foreground">
              {{ formatNumber(school.students) }}
            </td>
            <td class="px-4 py-3 text-muted-foreground">
              {{ school.managerName || 'غير محدد' }}
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
        جرّب تغيير البحث أو الفلاتر لعرض المزيد من البيانات.
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
              class="rounded-xl border border-border/50 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="5">
                5
              </option>
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="50">
                50
              </option>
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

            <span class="min-w-16 text-center text-sm text-foreground">
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
