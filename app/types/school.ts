export interface SchoolRecord {
  /** الرقم الوزاري للمدرسة */
  id: string
  /** اسم المدرسة */
  schoolName: string
  /** المدينة أو القرية */
  cityVillage: string
  /** المرحلة الدراسية */
  stage: string
  /** السلطة المشرفة على المدرسة */
  authority: string
  /** جنس المدرسة: بنين / بنات / مشترك */
  gender: string
  /** نوع المدرسة */
  schoolType: string
  /** نوع التعليم */
  educationType: string
  /** اسم مدير المدرسة */
  managerName: string
  /** إجمالي عدد الفصول */
  classes: number
  /** إجمالي عدد الطلاب */
  students: number
  /** مستقلة أو ملحقة */
  attachment: string
  /** المحافظة */
  governorate: string
  /** وقت الدراسة */
  studyTime: string
  /** ملكية المبنى */
  buildingOwnership: string
  /** الصف الأصلي كما ظهر في ملف Excel */
  raw: Record<string, unknown>
  /** رقم الصف داخل ورقة Excel */
  sourceRow: number
}

export interface ExcelSchoolState {
  schools: SchoolRecord[]
  loading: boolean
  error: string | null
  fileName: string
}
