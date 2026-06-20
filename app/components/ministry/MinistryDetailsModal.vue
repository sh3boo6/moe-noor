<script setup lang="ts">
import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import { normalizeHeader, toEnglishDigits } from '~/utils/normalize'

interface DetailSection {
  key: string
  label: string
  rows: Array<[string, unknown]>
}

interface TabDef {
  key: string
  label: string
  icon: string
}

const props = defineProps<{
  school: MinistrySchoolRecord | null
}>()

const emit = defineEmits<{
  close: []
}>()

const tabs: TabDef[] = [
  { key: 'identity', label: 'البيانات الأساسية', icon: 'i-lucide-school' },
  { key: 'students', label: 'إحصاءات الطلاب', icon: 'i-lucide-users' },
  { key: 'staff', label: 'الموارد البشرية', icon: 'i-lucide-id-card' },
  { key: 'facilities', label: 'التجهيزات', icon: 'i-lucide-monitor' },
  { key: 'building', label: 'المبنى والتجهيزات', icon: 'i-lucide-building-2' },
  { key: 'map', label: 'الخريطة', icon: 'i-lucide-map-pin' },
  { key: 'classification', label: 'التصنيفات', icon: 'i-lucide-tag' }
]

const managerIdAliases = ['هوية المدير', 'هوية مدير المدرسة', 'رقم هوية المدير', 'هوية مدير المدرسة (الرقم الوطني)', 'الرقم الوطني للمدير', 'الرقم الوطني لمدير المدرسة', 'الهوية', 'رقم الهوية']
const managerPhoneAliases = ['جوال المدير', 'جوال مدير المدرسة', 'هاتف المدير', 'هاتف مدير المدرسة', 'رقم جوال المدير', 'موبايل المدير', 'موبايل مدير المدرسة', 'رقم جوال مدير المدرسة']
const managerEmailAliases = ['بريد المدير', 'بريد مدير المدرسة', 'ايميل المدير', 'ايميل مدير المدرسة', 'إيميل المدير', 'إيميل مدير المدرسة', 'البريد الإلكتروني للمدير', 'البريد الإلكتروني لمدير المدرسة', 'البريد الالكتروني للمدير', 'البريد الالكتروني لمدير المدرسة']
const waterAliases = ['حالة الماء', 'الماء', 'مياه', 'خدمة المياه', 'شبكة المياه', 'حالة المياه']

const defaultTab = tabs[0]!
const activeTab = ref(defaultTab.key)

watch(
  () => props.school?.sourceRow,
  () => {
    activeTab.value = defaultTab.key
  }
)

const hasCoordinates = computed(() => {
  const s = props.school
  return s && s.building.latitude !== 0 && s.building.longitude !== 0
})

const googleMapsEmbedUrl = computed(() => {
  const s = props.school
  if (!s || !hasCoordinates.value) return ''
  const lat = s.building.latitude
  const lng = s.building.longitude
  return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`
})

const googleMapsLink = computed(() => {
  const s = props.school
  if (!s || !hasCoordinates.value) return ''
  return `https://maps.google.com/maps?q=${s.building.latitude},${s.building.longitude}`
})

const sections = computed<DetailSection[]>(() => {
  const school = props.school

  if (!school) {
    return []
  }

  return [
    {
      key: 'identity',
      label: 'البيانات الأساسية',
      rows: [
        ['الرقم الوزاري', school.identity.id],
        ['اسم المدرسة', school.identity.schoolName],
        ['المدينة/القرية', school.identity.cityVillage],
        ['إدارة التعليم', school.identity.educationDepartment],
        ['الترميز الموحد', school.identity.unifiedCode],
        ['المنطقة الإدارية', school.identity.administrativeRegion],
        ['المحافظة', school.identity.mailAddress],
        ['المرحلة الدراسية', school.identity.stage],
        ['جنس المدرسة', school.identity.gender],
        ['نوع التعليم', school.identity.educationType],
        ['وقت الدراسة', school.identity.studyTime],
        ['سنة التأسيس', school.identity.foundingYear],
        ['الهاتف', school.identity.phone],
        ['البريد الإلكتروني', school.identity.email]
      ]
    },
    {
      key: 'students',
      label: 'إحصاءات الطلاب',
      rows: [
        ['فصول جملة', school.students.classes],
        ['جملة طلاب', school.students.total],
        ['جملة سعودي', school.students.saudi],
        ['مستجدون', school.students.newcomers],
        ['طلاب الصف 1', school.students.grade1],
        ['سعودي الصف 1', school.students.saudi1],
        ['طلاب الصف 2', school.students.grade2],
        ['سعودي الصف 2', school.students.saudi2],
        ['طلاب الصف 3', school.students.grade3],
        ['سعودي الصف 3', school.students.saudi3],
        ['طلاب الصف 4', school.students.grade4],
        ['سعودي الصف 4', school.students.saudi4],
        ['طلاب الصف 5', school.students.grade5],
        ['سعودي الصف 5', school.students.saudi5],
        ['طلاب الصف 6', school.students.grade6],
        ['سعودي الصف 6', school.students.saudi6],
        ['طلاب الصف 7', school.students.grade7],
        ['سعودي الصف 7', school.students.saudi7],
        ['طلاب الصف 8', school.students.grade8],
        ['سعودي الصف 8', school.students.saudi8],
        ['طلاب الصف 9', school.students.grade9],
        ['سعودي الصف 9', school.students.saudi9],
        ['طلاب الصف 10', school.students.grade10],
        ['سعودي الصف 10', school.students.saudi10],
        ['طلاب الصف 11', school.students.grade11],
        ['سعودي الصف 11', school.students.saudi11],
        ['طلاب الصف 12', school.students.grade12],
        ['سعودي الصف 12', school.students.saudi12],
        ['مستجدون سعودي', school.students.saudiNewcomers],
        ['مستجدون حافلات', school.students.saudiBus],
        ['مجموع الصفوف', school.students.gradeTotal],
        ['فرق المطابقة', school.students.gradeTotalMismatch]
      ]
    },
    {
      key: 'staff',
      label: 'الموارد البشرية',
      rows: [
        ['اسم مدير المدرسة', school.staff.managerName],
        ['هوية المدير', staffValue(school, school.staff.managerId, managerIdAliases)],
        ['جوال المدير', staffValue(school, school.staff.managerPhone, managerPhoneAliases)],
        ['بريد المدير الإلكتروني', staffValue(school, school.staff.managerEmailOfficial, managerEmailAliases)],
        ['بريد مدير المدرسة', staffValue(school, school.staff.managerEmailPersonal, managerEmailAliases)],
        ['عدد المعلمين', school.staff.teachers],
        ['معلمين سعوديين', school.staff.saudiTeachers],
        ['عدد الإداريين', school.staff.admins],
        ['إداريين سعوديين', school.staff.saudiAdmins],
        ['عدد الوكلاء', school.staff.agents],
        ['عدد الموجهين', school.staff.guidance],
        ['عدد الأمناء', school.additional.librariansCount],
        ['عدد محضري المختبر', school.additional.labPreparersCount],
        ['عدد الخدم', school.additional.serviceStaff],
        ['عدد العمال', school.additional.workers]
      ]
    },
    {
      key: 'facilities',
      label: 'التجهيزات',
      rows: [
        ['معامل الكمبيوتر', school.facilities.computerLabs],
        ['مختبرات فيزياء', school.facilities.physicsLabs],
        ['مختبرات كيمياء', school.facilities.chemistryLabs],
        ['غرف اللغة الإنجليزية', school.facilities.englishRooms],
        ['غرف الخياطة', school.facilities.sewingRooms],
        ['معامل الخياطة والتدبير المنزلي', school.facilities.homeEconomicsRooms],
        ['عدد القاعات', school.additional.curriculumClassrooms],
        ['عدد الحجرات', school.additional.rooms],
        ['الإنترنت', school.facilities.internet ? 'متوفر ✓' : 'غير متوفر'],
        ['المقصف', school.facilities.cafeteria ? 'متوفر ✓' : 'غير متوفر'],
        ['حالة الماء', waterValue(school, school.facilities.water, waterAliases)],
        ['توجد مكتبة', school.additional.libraryExists ? 'نعم ✓' : 'لا'],
        ['المدرسة نائية', school.additional.remote ? 'نعم ✓' : 'لا'],
        ['المدرسة ضمن مجمع', school.additional.inComplex ? 'نعم ✓' : 'لا']
      ]
    },
    {
      key: 'building',
      label: 'المبنى والتجهيزات',
      rows: [
        ['ملكية المبنى', school.building.ownership],
        ['الإيجار', school.building.rent],
        ['نوع الاشتراك', school.building.subscriptionType],
        ['حالة الاستقلالية', school.building.independenceStatus],
        ['نوع الطريق', school.building.roadType],
        ['حالة الطريق', school.building.roadStatus],
        ['المسافة عن أقرب ابتدائي', school.building.nearestPrimaryDistance],
        ['المسافة عن أقرب متوسط', school.building.nearestMiddleDistance],
        ['المسافة عن أقرب ثانوي', school.building.nearestHighDistance]
      ]
    },
    {
      key: 'classification',
      label: 'التصنيفات',
      rows: [
        ['الطفولة المبكرة', school.classification.earlyChildhood ? 'نعم' : 'لا'],
        ['المسارات', school.classification.pathways ? 'نعم' : 'لا']
      ]
    }
  ]
})

const activeSection = computed(() => sections.value.find(section => section.key === activeTab.value) || sections.value[0] || { key: 'identity', label: 'البيانات الأساسية', rows: [] })

function findRawValue(school: MinistrySchoolRecord, aliases: string[]): unknown {
  const normalizedAliases = aliases.map(normalizeHeader)
  const match = Object.entries(school.raw).find(([key]) => normalizedAliases.includes(normalizeHeader(key)))

  return match?.[1]
}

function waterValue(school: MinistrySchoolRecord, value: boolean, aliases: string[]): unknown {
  const raw = findRawValue(school, aliases)

  if (raw && String(raw).trim()) {
    return raw
  }

  return value ? 'متوفر ✓' : 'غير متوفر'
}

function staffValue(school: MinistrySchoolRecord, value: string, aliases: string[]): unknown {
  return value || findRawValue(school, aliases)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'غير محدد'
  }

  const str = String(value)
  const converted = toEnglishDigits(str)

  if (typeof value === 'number' && !isNaN(Number(converted))) {
    return Number(converted).toLocaleString('en-US')
  }

  return converted
}
</script>

<template>
  <div
    v-if="school"
    dir="rtl"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <section
      class="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-accented/50 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl transition-colors duration-200"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <header class="flex items-start justify-between gap-4 border-b border-accented/50 dark:border-zinc-800 bg-gradient-to-l from-primary/5 dark:from-primary/10 to-transparent px-6 py-4">
        <div>
          <p class="text-xs font-medium tracking-wide text-primary/80 dark:text-primary-400">
            عرض التفاصيل
          </p>

          <h2 class="mt-1 text-xl font-semibold text-foreground dark:text-zinc-100">
            {{ school.identity.schoolName || 'مدرسة غير مسماة' }}
          </h2>

          <p class="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400">
            الصف {{ school.sourceRow }} • {{ school.identity.educationDepartment || 'إدارة غير محددة' }}
          </p>
        </div>

        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          aria-label="إغلاق"
          @click="emit('close')"
        />
      </header>

      <!-- Tabs -->
      <div class="border-b border-accented/50 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-6">
        <div class="flex gap-1 overflow-x-auto py-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150"
            :class="activeTab === tab.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-zinc-200'"
            @click="activeTab = tab.key"
          >
            <UIcon
              :name="tab.icon"
              class="h-3.5 w-3.5"
            />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div
        class="overflow-y-auto px-6 py-5"
        style="max-height: calc(92vh - 172px)"
      >
        <!-- Map tab -->
        <template v-if="activeTab === 'map'">
          <div
            v-if="hasCoordinates"
            class="flex flex-col gap-4"
          >
            <!-- Coordinates bar -->
            <div class="flex items-center justify-between gap-3 rounded-2xl border border-accented/50 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40 p-4">
              <div class="flex gap-6">
                <div>
                  <p class="text-xs text-muted-foreground dark:text-zinc-400">
                    خط العرض
                  </p>
                  <p class="mt-1 font-semibold text-foreground dark:text-zinc-200">
                    {{ school.building.latitude }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground dark:text-zinc-400">
                    خط الطول
                  </p>
                  <p class="mt-1 font-semibold text-foreground dark:text-zinc-200">
                    {{ school.building.longitude }}
                  </p>
                </div>
              </div>
              <a
                :href="googleMapsLink"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <UIcon
                  name="i-lucide-external-link"
                  class="h-4 w-4"
                />
                فتح في خرائط قوقل
              </a>
            </div>

            <!-- Map iframe -->
            <div class="overflow-hidden rounded-2xl border border-accented/50 dark:border-zinc-800 shadow-sm">
              <iframe
                :src="googleMapsEmbedUrl"
                class="h-[400px] w-full invert-[0.05] hue-rotate-180 dark:invert dark:hue-rotate-180"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                loading="lazy"
                allowfullscreen
                :title="`موقع ${school.identity.schoolName}`"
              />
            </div>
          </div>

          <!-- No coordinates placeholder -->
          <div
            v-else
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-accented/50 dark:border-zinc-800 py-16 text-center"
          >
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 dark:bg-zinc-800/50">
              <UIcon
                name="i-lucide-map-off"
                class="h-7 w-7 text-muted-foreground dark:text-zinc-400"
              />
            </div>
            <p class="font-medium text-foreground dark:text-zinc-200">
              لا تتوفر إحداثيات لهذه المدرسة
            </p>
            <p class="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
              لم يتم تسجيل خط العرض وخط الطول في ملف البيانات.
            </p>
          </div>
        </template>

        <!-- Data tabs -->
        <template v-else>
          <div class="grid gap-3 md:grid-cols-2">
            <div
              v-for="([label, value]) in activeSection.rows"
              :key="String(label)"
              class="rounded-2xl border border-accented/50 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/30 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
            >
              <p class="text-xs font-medium text-muted-foreground dark:text-zinc-400">
                {{ label }}
              </p>

              <p class="mt-2 break-words text-sm font-semibold text-foreground dark:text-zinc-200">
                {{ formatValue(value) }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
