<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const toast = useToast()

// ─── استيراد البيانات من الـ Excel Worker ──────────────────────────────────
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

// ─── نظام الفلاتر المترابطة (Cross-Filter / Excel Slicers) ────────────────
const {
  filters,
  hasActiveFilters,
  filteredSchools,
  filterOptionDefs,
  updateFilter,
  resetFilters: resetFilterState,
  clearFilter
} = useSchoolFilters(schools)

// ─── حالة الصفحة ──────────────────────────────────────────────────────────
const selectedSchool = ref<MinistrySchoolRecord | null>(null)
const uploadDate = ref<string>('')
const showConfirmClear = ref(false)

useHead({
  title: 'لوحة الصيغة الوزارية الشاملة',
  meta: [
    { name: 'description', content: 'لوحة تحليل متقدمة لقراءة ملفات Excel الوزارية الشاملة من برنامج نور وعرض بيانات المدارس.' }
  ]
})

// ─── معالجة الأحداث ────────────────────────────────────────────────────────

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

function confirmClearAll() {
  clearSchools()
  uploadDate.value = ''
  resetFilterState()
  showConfirmClear.value = false
}

function resetFilters() {
  resetFilterState()
  toast.add({
    title: 'تمت إعادة الفلاتر بنجاح',
    icon: 'i-lucide-check-circle',
    duration: 1250
  })
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
            :options="filterOptionDefs"
            @change="updateFilter"
            @clear="clearFilter"
          />
        </div>

        <div class="mt-6">
          <MinistryKpiCards
            :schools="filteredSchools"
            :warning-count="warningCount"
            :has-active-filters="hasActiveFilters"
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
