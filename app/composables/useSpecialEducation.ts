import type { MinistrySchoolRecord } from '~/types/ministrySchool'
import { cleanText, toEnglishDigits } from '~/utils/normalize'

export interface SpecialEducationMetric {
  key: string
  label: string
  column: string
}

export interface SpecialEducationRecord {
  id: string
  values: Record<string, number>
}

const ID_COLUMN = 'الرقم الاحصائي'

export const SPECIAL_EDUCATION_TOTAL: SpecialEducationMetric = {
  key: 'total',
  label: 'طلاب الإعاقة - قسم عام',
  column: 'طلاب الاعاقة - قسم عام'
}

export const SPECIAL_EDUCATION_CATEGORIES: SpecialEducationMetric[] = [
  { key: 'hearing', label: 'الإعاقة السمعية', column: 'الإعاقة السمعية' },
  { key: 'visual', label: 'الإعاقة البصرية', column: 'الإعاقة البصرية' },
  { key: 'autism', label: 'اضطراب طيف التوحد', column: 'اضطراب طيف التوحد' },
  { key: 'adhd', label: 'فرط الحركة وتشتت الانتباه', column: 'فرط الحركة وتشتت الانتباه' },
  { key: 'physical', label: 'إعاقة جسمية وصحية', column: 'إعاقة جسمية وصحية' },
  { key: 'slowLearning', label: 'بطء التعلم (الذكاء الحدي)', column: 'بطء التعلم (الذكاء الحدي)' },
  { key: 'learningDifficulties', label: 'صعوبات التعلم', column: 'صعوبات التعلم' },
  { key: 'behavioral', label: 'الاضطرابات السلوكية والانفعالية', column: 'الاضطرابات السلوكية والانفعالية' },
  { key: 'speech', label: 'اضطرابات اللغة والكلام', column: 'اضطرابات اللغة والكلام' },
  { key: 'multiple', label: 'تعدد العوق', column: 'تعدد العوق' },
  { key: 'intellectual', label: 'الإعاقة الفكرية', column: 'الإعاقة الفكرية' }
]

export const SPECIAL_EDUCATION_PROGRAMS: SpecialEducationMetric[] = [
  { key: 'intellectualBoys', label: 'تربية فكرية بنين', column: 'تربية فكرية بنين' },
  { key: 'intellectualGirls', label: 'تربية فكرية بنات', column: 'تربية فكرية بنات' },
  { key: 'autismBoys', label: 'توحد بنين', column: 'توحد بنين' },
  { key: 'autismGirls', label: 'توحد بنات', column: 'توحد بنات' },
  { key: 'multipleBoys', label: 'تعدد عوق بنين', column: 'تعدد عوق بنين' },
  { key: 'multipleGirls', label: 'تعدد عوق بنات', column: 'تعدد عوق بنات' }
]

const ALL_METRICS = [SPECIAL_EDUCATION_TOTAL, ...SPECIAL_EDUCATION_CATEGORIES, ...SPECIAL_EDUCATION_PROGRAMS]

function toNumber(value: unknown): number {
  const parsed = Number(toEnglishDigits(cleanText(String(value ?? ''))).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

async function parseSpecialEducationFile(file: File): Promise<SpecialEducationRecord[]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined

  if (!sheet) {
    throw new Error('لا يحتوي الملف على أوراق بيانات')
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (!rows.length || !(ID_COLUMN in rows[0]!)) {
    throw new Error(`لم يتم العثور على عمود «${ID_COLUMN}» في الملف`)
  }

  const records = new Map<string, SpecialEducationRecord>()

  for (const row of rows) {
    const id = toEnglishDigits(cleanText(String(row[ID_COLUMN] ?? '')))

    if (!id) {
      continue
    }

    const values: Record<string, number> = {}
    for (const metric of ALL_METRICS) {
      values[metric.key] = toNumber(row[metric.column])
    }

    records.set(id, { id, values })
  }

  return Array.from(records.values())
}

export function useSpecialEducation(schools: Readonly<Ref<MinistrySchoolRecord[]>>) {
  const records = ref<SpecialEducationRecord[]>([])
  const fileName = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const recordsById = computed(() => new Map(records.value.map(record => [record.id, record])))

  /** سجلات التربية الخاصة المطابقة (بالرقم الوزاري) للمدارس المفلترة، دون تكرار */
  const matched = computed(() => {
    const seen = new Set<string>()
    const result: SpecialEducationRecord[] = []

    for (const school of schools.value) {
      const id = toEnglishDigits(cleanText(school.identity.id))
      const record = recordsById.value.get(id)

      if (record && !seen.has(id)) {
        seen.add(id)
        result.push(record)
      }
    }

    return result
  })

  const totals = computed(() => {
    const sums: Record<string, number> = {}

    for (const metric of ALL_METRICS) {
      sums[metric.key] = matched.value.reduce((sum, record) => sum + (record.values[metric.key] ?? 0), 0)
    }

    return sums
  })

  const schoolsWithStudents = computed(() =>
    matched.value.filter(record => (record.values.total ?? 0) > 0).length
  )

  async function parseFile(file: File) {
    loading.value = true
    error.value = null

    try {
      records.value = await parseSpecialEducationFile(file)
      fileName.value = file.name
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'تعذر قراءة ملف التربية الخاصة'
    } finally {
      loading.value = false
    }
  }

  function clear() {
    records.value = []
    fileName.value = ''
    error.value = null
  }

  return {
    records,
    fileName,
    loading,
    error,
    matched,
    totals,
    schoolsWithStudents,
    parseFile,
    clear
  }
}
