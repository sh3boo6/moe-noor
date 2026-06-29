<script setup lang="ts">
import type { MinistryFilters, MinistrySchoolRecord } from '~/types/ministrySchool'
import { normalizeGender } from '~/utils/normalize'

const toast = useToast()

const {
  schools,
  headers,
  loading,
  error,
  fileName,
  warningCount,
  parseFile,
  clearSchools
} = useMinistryExcel()

const filters = reactive<MinistryFilters>({
  educationDepartment: [],
  administrativeRegion: [],
  stage: [],
  gender: [],
  authority: [],
  buildingOwnership: [],
  studyTime: [],
  educationType: [],
  governorate: []
})

const selectedSchool = ref<MinistrySchoolRecord | null>(null)
const uploadDate = ref<string>('')

useHead({
  title: 'لوحة الصيغة الوزارية الشاملة',
  meta: [
    { name: 'description', content: 'لوحة تحليل متقدمة لقراءة ملفات Excel الوزارية الشاملة من برنامج نور وعرض بيانات المدارس.' }
  ]
})

// تستخرج القيم الفريدة من عمود محدد لاستخدامها في قوائم الفلاتر.
function uniqueIdentityValues(field: keyof Pick<MinistrySchoolRecord['identity'], 'educationDepartment' | 'administrativeRegion' | 'stage' | 'gender' | 'authority' | 'studyTime' | 'educationType'>): string[] {
  return Array.from(new Set(schools.value.map(school => school.identity[field]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'ar'))
}

const uniqueBuildingOwnership = computed(() => Array.from(new Set(schools.value.map(school => school.building.ownership).filter(Boolean)))
  .sort((a, b) => a.localeCompare(b, 'ar')))

const uniqueGovernorate = computed(() => Array.from(new Set(schools.value.map(school => school.additional.governorate).filter(Boolean)))
  .sort((a, b) => a.localeCompare(b, 'ar')))

const uniqueGenderOptions = computed(() => Array.from(new Set(schools.value.map(school => normalizeGender(school.identity.gender || '')).filter(Boolean)))
  .sort((a, b) => a.localeCompare(b, 'ar')))

const filterOptions = computed(() => [
  { key: 'educationDepartment' as const, label: 'إدارة التعليم', placeholder: 'كل إدارات التعليم', options: uniqueIdentityValues('educationDepartment') },
  { key: 'administrativeRegion' as const, label: 'المنطقة الإدارية', placeholder: 'كل المناطق', options: uniqueIdentityValues('administrativeRegion') },
  { key: 'stage' as const, label: 'المرحلة', placeholder: 'كل المراحل', options: uniqueIdentityValues('stage') },
  { key: 'gender' as const, label: 'الجنس', placeholder: 'كل الأجناس', options: uniqueGenderOptions.value },
  { key: 'authority' as const, label: 'السلطة', placeholder: 'كل السلطات', options: uniqueIdentityValues('authority') },
  { key: 'buildingOwnership' as const, label: 'نوع المبنى', placeholder: 'كل أنواع المباني', options: uniqueBuildingOwnership.value },
  { key: 'studyTime' as const, label: 'وقت الدراسة', placeholder: 'كل الأوقات', options: uniqueIdentityValues('studyTime') },
  { key: 'educationType' as const, label: 'نوع التعليم', placeholder: 'كل أنواع التعليم', options: uniqueIdentityValues('educationType') },
  { key: 'governorate' as const, label: 'المحافظة', placeholder: 'كل المحافظات', options: uniqueGovernorate.value }
])

// تطبق الفلاتر المتقدمة قبل تمرير البيانات إلى الرسوم والجداول.
const filteredSchools = computed(() => schools.value.filter((school) => {
  const identity = school.identity

  return (!filters.educationDepartment.length || filters.educationDepartment.includes(identity.educationDepartment))
    && (!filters.administrativeRegion.length || filters.administrativeRegion.includes(identity.administrativeRegion))
    && (!filters.stage.length || filters.stage.includes(identity.stage))
    && (!filters.gender.length || filters.gender.includes(normalizeGender(identity.gender || '')))
    && (!filters.authority.length || filters.authority.includes(identity.authority))
    && (!filters.buildingOwnership.length || filters.buildingOwnership.includes(school.building.ownership))
    && (!filters.studyTime.length || filters.studyTime.includes(identity.studyTime))
    && (!filters.educationType.length || filters.educationType.includes(identity.educationType))
    && (!filters.governorate.length || filters.governorate.includes(school.additional.governorate))
}))

function updateUploadDate(data: { uploadedAt: string }) {
  uploadDate.value = new Date(data.uploadedAt).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleFile(file: File) {
  await parseFile(file)
}

const showConfirmClear = ref(false)

function confirmClearAll() {
  clearAll()
  showConfirmClear.value = false
}

function clearAll() {
  clearSchools()
  uploadDate.value = ''
  resetFilters()
}

function successAction(title: string) {
  toast.add({
    title: title,
    icon: 'i-lucide-check-circle',
    duration: 1250
  })
}

function updateFilter(key: keyof MinistryFilters, value: string | string[]) {
  filters[key] = value as string[]
}

function resetFilters() {
  filters.educationDepartment = []
  filters.administrativeRegion = []
  filters.stage = []
  filters.gender = []
  filters.authority = []
  filters.buildingOwnership = []
  filters.studyTime = []
  filters.educationType = []
  filters.governorate = []
  successAction('تمت العملية بنجاح')
}
</script>

<template>
  <main
    dir="rtl"
    class="min-h-screen bg-background py-6 text-right sm:py-10"
  >
    <div class="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <section class="mb-6 overflow-hidden rounded-3xl border border-accented/50 bg-card shadow-sm">
        <div class="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
          <div>
            <div class="mb-3 flex items-center gap-3 text-xl font-medium text-primary">
              <img
                src="/img/logo.png"
                alt="شعار وزارة التعليم"
                class="h-16 w-auto hidden lg:flex"
              >
            </div>

            <h1 class="text-xl font-semibold tracking-tight text-foreground">
              لوحة تحليل البيانات الوزارية
            </h1>

            <p class="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              استورد ملف Excel من برنامج نور لتحصل على تحليل شامل لبيانات المدارس، مع مؤشرات ورسوم بيانية وجداول تفاعلية تساعدك في اتخاذ قرارات مبنية على البيانات.
            </p>
          </div>

          <div class="rounded-2xl border border-accented/50 bg-muted/20 p-5">
            <p class="text-xs font-medium text-muted-foreground flex justify-between items-start">
              <span>الملف الحالي</span>
              <span class="text-primary/80 text-xs">{{ uploadDate || '' }}</span>
            </p>

            <p class="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
              <span>{{ fileName || 'لم يتم اختيار ملف بعد' }}</span>
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-card p-3">
                <p class="text-xs text-muted-foreground">
                  السجلات
                </p>
                <p class="mt-1 text-2xl font-semibold text-foreground">
                  {{ filteredSchools.length }}
                </p>
              </div>

              <div class="rounded-xl bg-card p-3">
                <p class="text-xs text-muted-foreground">
                  الأعمدة
                </p>
                <p class="mt-1 text-2xl font-semibold text-foreground">
                  {{ headers.length }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MinistryUploadZone
        v-if="!fileName"
        @file-selected="handleFile"
        @file-stored="updateUploadDate"
      />

      <div
        v-if="loading"
        class="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4"
      >
        <div class="mb-3 flex items-center justify-between text-sm font-medium text-primary">
          <span>جاري قراءة ومعالجة ملف Excel داخل Web Worker...</span>
          <UIcon
            name="i-lucide-loader-2"
            class="h-4 w-4 animate-spin"
          />
        </div>

        <UProgress
          indeterminate
          color="primary"
        />
      </div>

      <UAlert
        v-if="error"
        class="mt-6"
        color="error"
        variant="subtle"
        title="تعذر قراءة الملف"
        :description="error"
      />

      <UAlert
        v-if="warningCount"
        class="mt-6"
        color="warning"
        variant="subtle"
        :title="`يوجد ${warningCount} مدرسة بها اختلاف بين مجموع الصفوف وجملة طلاب`"
        description="تم عرض بيانات المدارس مع الاحتفاظ بعلامة تنبيه لجودة البيانات."
      />

      <template v-if="schools.length">
        <div class="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-foreground">
              لوحة التحليل
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              مؤشرات ورسوم مبنية على البيانات المفلترة.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <!-- <MinistryPdfExport :schools="filteredSchools" /> -->

            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              label="إعادة الفلاتر"
              icon="i-lucide-rotate-ccw"
              @click="resetFilters"
            />

            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              label="مسح البيانات"
              icon="i-lucide-trash-2"
              @click="showConfirmClear = true"
            />
          </div>
        </div>

        <UModal v-model:open="showConfirmClear">
          <template #content>
            <div class="p-6">
              <h3 class="text-lg font-semibold">
                تأكيد مسح البيانات
              </h3>
              <p class="mt-2 text-sm text-muted-foreground">
                هل أنت متأكد من رغبتك في مسح جميع البيانات والفلاتر المحملة؟
                لا يمكن التراجع عن هذه العملية.
              </p>
              <div class="mt-6 flex justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="soft"
                  label="إلغاء"
                  @click="showConfirmClear = false"
                />
                <UButton
                  color="error"
                  label="نعم، مسح البيانات"
                  @click="confirmClearAll"
                />
              </div>
            </div>
          </template>
        </UModal>

        <div class="mt-5">
          <MinistryFilters
            :filters="filters"
            :options="filterOptions"
            @change="updateFilter"
          />
        </div>

        <div class="mt-6">
          <MinistryKpiCards
            :schools="filteredSchools"
            :warning-count="warningCount"
          />
        </div>

        <div class="mt-6">
          <MinistryPowerTable
            :schools="filteredSchools"
            :headers="headers"
            @open-details="selectedSchool = $event"
          />
        </div>

        <div class="mt-6">
          <MinistryDensityTable :schools="filteredSchools" />
        </div>

        <div class="mt-6">
          <MinistryCharts :schools="filteredSchools" />
        </div>
      </template>

      <section
        v-else
        class="mt-6 grid gap-4 rounded-3xl border border-accented/50 bg-card p-6 shadow-sm md:grid-cols-3"
      >
        <div class="rounded-2xl bg-muted/50 p-5">
          <UIcon
            name="i-lucide-columns-4"
            class="mb-3 h-6 w-6 text-primary"
          />
          <h3 class="text-sm font-semibold text-foreground">
            Mapping شامل
          </h3>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            يتم التعرف على أعمدة الهوية، الطلاب، الكادر، التجهيزات، المبنى والجغرافيا حتى مع اختلاف تسميات الرؤوس.
          </p>
        </div>

        <div class="rounded-2xl bg-muted/50 p-5">
          <UIcon
            name="i-lucide-cpu"
            class="mb-3 h-6 w-6 text-primary"
          />
          <h3 class="text-sm font-semibold text-foreground">
            معالجة غير متزامنة
          </h3>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            يتم تشغيل Parsing داخل Web Worker لمنع تعليق واجهة Tauri عند استيراد ملفات كبيرة.
          </p>
        </div>

        <div class="rounded-2xl bg-muted/50 p-5">
          <UIcon
            name="i-lucide-table-properties"
            class="mb-3 h-6 w-6 text-primary"
          />
          <h3 class="text-sm font-semibold text-foreground">
            جدول قوي
          </h3>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            يدعم التمرير الأفقي، إخفاء الأعمدة، البحث، الفلاتر، الترقيم وعرض كافة التفاصيل.
          </p>
        </div>
      </section>
    </div>

    <MinistryDetailsModal
      :school="selectedSchool"
      @close="selectedSchool = null"
    />
  </main>
</template>
