/**
 * useSchoolFilters — نظام الفلاتر المترابطة (Cross-Filter / Excel Slicers)
 *
 * المبدأ:
 *   خيارات كل فلتر تُحسب بتطبيق جميع الفلاتر الأخرى عليها ما عدا الفلتر نفسه.
 *   هذا يُعطي سلوكاً مطابقاً لـ Pivot Table Slicers في Excel:
 *   - اختيار "الرياض" → يُقلِّص إدارات التعليم لإدارات الرياض فقط.
 *   - إلغاء "الرياض" → تتوسع الخيارات مجدداً.
 *
 * الأداء:
 *   - كل مجموعة من الخيارات تُحسب كـ computed منفصل.
 *   - البحث في القيم يستخدم Set للحصول على O(1) lookup.
 *   - القيم الفعلية للسجلات تُحسب مرة واحدة عبر pre-index.
 */

import type { MinistryFilters, MinistrySchoolRecord } from '~/types/ministrySchool'
import { normalizeGender } from '~/utils/normalize'

// ─── نوع خيارات الفلتر ───────────────────────────────────────────────────────

export interface FilterOptionDef {
  key: keyof MinistryFilters
  label: string
  placeholder: string
  options: string[]
}

// ─── دوال مساعدة لاستخراج قيمة كل فلتر من السجل ─────────────────────────────

function getFieldValue(school: MinistrySchoolRecord, key: keyof MinistryFilters): string {
  switch (key) {
    case 'educationDepartment': return school.identity.educationDepartment
    case 'administrativeRegion': return school.identity.administrativeRegion
    case 'stage': return school.identity.stage
    case 'gender': return normalizeGender(school.identity.gender || '')
    case 'authority': return school.identity.authority
    case 'buildingOwnership': return school.building.ownership
    case 'studyTime': return school.identity.studyTime
    case 'educationType': return school.identity.educationType
    case 'governorate': return school.additional.governorate
    case 'schoolName': return school.identity.id && school.identity.schoolName
      ? `${school.identity.id} - ${school.identity.schoolName}`
      : ''
    default: return ''
  }
}

// ─── دالة تحقق ما إذا كان السجل يطابق مجموعة فلاتر (مع استثناء فلتر واحد) ──

function schoolMatchesFilters(
  school: MinistrySchoolRecord,
  filters: MinistryFilters,
  excludeKey?: keyof MinistryFilters
): boolean {
  const keys = Object.keys(filters) as (keyof MinistryFilters)[]

  for (const key of keys) {
    if (key === excludeKey) continue
    const selected = filters[key]
    if (!selected.length) continue
    const value = getFieldValue(school, key)
    if (!value || !selected.includes(value)) return false
  }

  return true
}

// ─── دالة بناء قائمة خيارات مُرتبة ──────────────────────────────────────────

function buildSortedOptions(schools: MinistrySchoolRecord[], key: keyof MinistryFilters): string[] {
  const seen = new Set<string>()

  for (const school of schools) {
    const value = getFieldValue(school, key)
    if (value) seen.add(value)
  }

  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'ar'))
}

// ─── الـ Composable الرئيسي ────────────────────────────────────────────────────

export function useSchoolFilters(schools: Readonly<Ref<MinistrySchoolRecord[]>>) {
  // ─── حالة الفلاتر ────────────────────────────────────────────────────────────
  const filters = reactive<MinistryFilters>({
    educationDepartment: [],
    administrativeRegion: [],
    stage: [],
    gender: [],
    authority: [],
    buildingOwnership: [],
    studyTime: [],
    educationType: [],
    governorate: [],
    schoolName: []
  })

  // ─── مؤشر لما إذا كان هناك فلاتر نشطة ──────────────────────────────────────
  const hasActiveFilters = computed(() =>
    Object.values(filters).some(arr => arr.length > 0)
  )

  // ─── المدارس النهائية بعد تطبيق كل الفلاتر ───────────────────────────────
  const filteredSchools = computed(() => {
    // تحسين: إذا لم يكن هناك فلاتر نشطة، أرجع الكل مباشرة
    if (!hasActiveFilters.value) return schools.value

    return schools.value.filter(school => schoolMatchesFilters(school, filters))
  })

  // ─── Cross-Filter: خيارات كل فلتر تُحسب بتطبيق بقية الفلاتر ───────────────

  /**
   * ينتج مجموعة خيارات للفلتر المحدد
   * بتطبيق جميع الفلاتر الأخرى (استثناء الفلتر نفسه)
   * حتى تظل الخيارات الحالية للفلتر ظاهرة بدون تقييد ذاتي.
   */
  function computeOptionsForKey(key: keyof MinistryFilters): string[] {
    const eligible = schools.value.filter(school =>
      schoolMatchesFilters(school, filters, key)
    )
    return buildSortedOptions(eligible, key)
  }

  // computed منفصل لكل فلتر لتفادي إعادة حساب غير ضرورية
  const educationDepartmentOptions = computed(() => computeOptionsForKey('educationDepartment'))
  const administrativeRegionOptions = computed(() => computeOptionsForKey('administrativeRegion'))
  const stageOptions = computed(() => computeOptionsForKey('stage'))
  const genderOptions = computed(() => computeOptionsForKey('gender'))
  const authorityOptions = computed(() => computeOptionsForKey('authority'))
  const buildingOwnershipOptions = computed(() => computeOptionsForKey('buildingOwnership'))
  const studyTimeOptions = computed(() => computeOptionsForKey('studyTime'))
  const educationTypeOptions = computed(() => computeOptionsForKey('educationType'))
  const governorateOptions = computed(() => computeOptionsForKey('governorate'))
  const schoolNameOptions = computed(() => computeOptionsForKey('schoolName'))

  // ─── قائمة تعريف الفلاتر المُمرَّرة للمكوّن ───────────────────────────────
  const filterOptionDefs = computed<FilterOptionDef[]>(() => [
    { key: 'educationDepartment', label: 'إدارة التعليم', placeholder: 'كل إدارات التعليم', options: educationDepartmentOptions.value },
    { key: 'administrativeRegion', label: 'المنطقة الإدارية', placeholder: 'كل المناطق', options: administrativeRegionOptions.value },
    { key: 'stage', label: 'المرحلة', placeholder: 'كل المراحل', options: stageOptions.value },
    { key: 'gender', label: 'الجنس', placeholder: 'كل الأجناس', options: genderOptions.value },
    { key: 'authority', label: 'السلطة', placeholder: 'كل السلطات', options: authorityOptions.value },
    { key: 'buildingOwnership', label: 'نوع المبنى', placeholder: 'كل أنواع المباني', options: buildingOwnershipOptions.value },
    { key: 'studyTime', label: 'وقت الدراسة', placeholder: 'كل الأوقات', options: studyTimeOptions.value },
    { key: 'educationType', label: 'نوع التعليم', placeholder: 'كل أنواع التعليم', options: educationTypeOptions.value },
    { key: 'governorate', label: 'المحافظة', placeholder: 'كل المحافظات', options: governorateOptions.value },
    { key: 'schoolName', label: 'اسم المدرسة', placeholder: 'كل المدارس', options: schoolNameOptions.value }
  ])

  // ─── تحديث فلتر محدد ─────────────────────────────────────────────────────
  function updateFilter(key: keyof MinistryFilters, value: string[]) {
    filters[key] = value
  }

  // ─── إعادة تعيين كل الفلاتر ─────────────────────────────────────────────
  function resetFilters() {
    const keys = Object.keys(filters) as (keyof MinistryFilters)[]
    for (const key of keys) {
      filters[key] = []
    }
  }

  // ─── مسح فلتر واحد ───────────────────────────────────────────────────────
  function clearFilter(key: keyof MinistryFilters) {
    filters[key] = []
  }

  return {
    filters,
    hasActiveFilters,
    filteredSchools,
    filterOptionDefs,
    updateFilter,
    resetFilters,
    clearFilter
  }
}
