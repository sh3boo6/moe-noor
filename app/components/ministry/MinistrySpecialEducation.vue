<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import {
  SPECIAL_EDUCATION_CATEGORIES,
  SPECIAL_EDUCATION_PROGRAMS,
  SPECIAL_EDUCATION_TOTAL
} from '~/composables/useSpecialEducation'

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

const summaryCards = computed(() => [
  {
    label: 'مدارس لديها طلاب إعاقة',
    value: format(schoolsWithStudents.value),
    description: `من ${format(matched.value.length)} مدرسة مطابقة في الملف`,
    icon: 'i-lucide-school'
  },
  {
    label: SPECIAL_EDUCATION_TOTAL.label,
    value: format(totals.value[SPECIAL_EDUCATION_TOTAL.key]),
    description: 'إجمالي الطلاب حسب الفلاتر الحالية',
    icon: 'i-lucide-accessibility'
  }
])

const categoryCards = computed(() =>
  SPECIAL_EDUCATION_CATEGORIES.map(metric => ({
    label: metric.label,
    value: format(totals.value[metric.key])
  }))
)

const programCards = computed(() =>
  SPECIAL_EDUCATION_PROGRAMS.map(metric => ({
    label: metric.label,
    value: format(totals.value[metric.key])
  }))
)
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
              :name="card.icon"
              class="h-5 w-5 text-primary"
            />
          </div>
          <p class="mt-2 text-3xl font-semibold text-foreground">
            {{ card.value }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ card.description }}
          </p>
        </div>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-foreground">
          حسب فئة الإعاقة
        </h3>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="card in categoryCards"
            :key="card.label"
            class="rounded-2xl border border-accented/50 bg-card p-4"
          >
            <p class="text-xs text-muted-foreground">
              {{ card.label }}
            </p>
            <p class="mt-1 text-2xl font-semibold text-foreground">
              {{ card.value }}
            </p>
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
            :key="card.label"
            class="rounded-2xl border border-accented/50 bg-card p-4"
          >
            <p class="text-xs text-muted-foreground">
              {{ card.label }}
            </p>
            <p class="mt-1 text-2xl font-semibold text-foreground">
              {{ card.value }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
