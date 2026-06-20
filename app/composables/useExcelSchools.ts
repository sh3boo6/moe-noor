import * as XLSX from 'xlsx'
import type { SchoolRecord } from '~/types/school'
import { cleanText, normalizeHeader, toEnglishDigits } from '~/utils/normalize'

const SUPPORTED_EXTENSIONS = new Set(['.xlsx', '.xls', '.xlsm', '.csv'])

const COLUMN_KEYS: Record<keyof Omit<SchoolRecord, 'raw' | 'sourceRow'>, string[]> = {
  id: ['الرقم الوزاري', 'الرقم الوزاري (ID)', 'ID', 'رقم الوزارة', 'الرقم'],
  schoolName: ['اسم المدرسة', 'المدرسة', 'اسم المدرسة/الروضة'],
  cityVillage: ['المدينة/القرية', 'المدينة', 'القرية', 'المدينة او القرية', 'المدينة أو القرية'],
  stage: ['المرحلة', 'المرحلة الدراسية'],
  authority: ['السلطة', 'نوع السلطة', 'القطاع'],
  gender: ['جنس المدرسة', 'جنس الطلاب', 'الجنس'],
  schoolType: ['نوع المدرسة', 'نوع المؤسسة'],
  educationType: ['نوع التعليم'],
  managerName: ['اسم مدير المدرسة', 'مدير المدرسة', 'المدير', 'اسم مديرة المدرسة', 'مديرة المدرسة', 'المديرة'],
  classes: ['فصول جملة', 'عدد الفصول', 'الفصول'],
  students: ['جملة طلاب', 'عدد الطلاب', 'الطلاب', 'جملة الطلبة'],
  attachment: ['مستقلة/ملحقة', 'مستقلة أو ملحقة', 'مستقلة - ملحقة'],
  governorate: ['المحافظة'],
  studyTime: ['وقت الدراسة', 'الدوام', 'الفترة الدراسية'],
  buildingOwnership: ['ملكية المبنى', 'ملكية البناء', 'نوع الملكية']
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const normalized = toEnglishDigits(cleanText(String(value ?? '')))
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')

  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

function findColumnValue(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return cleanText(String(row[key]))
    }
  }

  const normalizedKeys = keys.map(normalizeHeader)
  const matchedKey = Object.keys(row).find(key => normalizedKeys.includes(normalizeHeader(key)))

  return matchedKey ? cleanText(String(row[matchedKey])) : ''
}

function hasMeaningfulData(record: Omit<SchoolRecord, 'raw' | 'sourceRow'>): boolean {
  return Object.values(record).some((value) => {
    if (typeof value === 'number') {
      return value > 0
    }

    return cleanText(String(value ?? '')).length > 0
  })
}

function mapRowToSchool(row: Record<string, unknown>, sourceRow: number): SchoolRecord {
  const mapped = {
    id: findColumnValue(row, COLUMN_KEYS.id),
    schoolName: findColumnValue(row, COLUMN_KEYS.schoolName),
    cityVillage: findColumnValue(row, COLUMN_KEYS.cityVillage),
    stage: findColumnValue(row, COLUMN_KEYS.stage),
    authority: findColumnValue(row, COLUMN_KEYS.authority),
    gender: findColumnValue(row, COLUMN_KEYS.gender),
    schoolType: findColumnValue(row, COLUMN_KEYS.schoolType),
    educationType: findColumnValue(row, COLUMN_KEYS.educationType),
    managerName: findColumnValue(row, COLUMN_KEYS.managerName),
    classes: parseNumber(findColumnValue(row, COLUMN_KEYS.classes)),
    students: parseNumber(findColumnValue(row, COLUMN_KEYS.students)),
    attachment: findColumnValue(row, COLUMN_KEYS.attachment),
    governorate: findColumnValue(row, COLUMN_KEYS.governorate),
    studyTime: findColumnValue(row, COLUMN_KEYS.studyTime),
    buildingOwnership: findColumnValue(row, COLUMN_KEYS.buildingOwnership)
  }

  return {
    ...mapped,
    raw: row,
    sourceRow
  }
}

export function useExcelSchools() {
  const schools = ref<SchoolRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const fileName = ref('')

  const clearSchools = () => {
    schools.value = []
    fileName.value = ''
    error.value = null
  }

  const readExcelFile = async (file: File) => {
    loading.value = true
    error.value = null
    fileName.value = file.name

    try {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLocaleLowerCase()

      if (!SUPPORTED_EXTENSIONS.has(extension)) {
        throw new Error('يرجى اختيار ملف Excel بصيغة .xlsx أو .xls أو .xlsm أو .csv')
      }

      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

      const firstSheetName = workbook.SheetNames[0] ?? ''

      if (!firstSheetName) {
        throw new Error('لا يحتوي الملف على أوراق بيانات')
      }

      const worksheet = workbook.Sheets[firstSheetName]!
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })
      const mappedRows = rows
        .map((row, index) => mapRowToSchool(row, index + 2))
        .filter(record => hasMeaningfulData(record))

      if (!mappedRows.length) {
        throw new Error('لم يتم العثور على بيانات متوافقة مع أعمدة المدارس المتوقعة')
      }

      schools.value = mappedRows
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'حدث خطأ غير متوقع أثناء قراءة الملف'
      error.value = message
      schools.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    schools,
    loading,
    error,
    fileName,
    readExcelFile,
    clearSchools
  }
}
