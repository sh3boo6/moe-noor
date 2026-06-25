import * as XLSX from 'xlsx'
import type { MinistryExcelPayload, MinistrySchoolRecord } from '~/types/ministrySchool'
import { cleanText, normalizeHeader, toEnglishDigits } from '~/utils/normalize'

interface ColumnDefinition {
  key: string
  label: string
  aliases: string[]
}

interface WorkerParseRequest {
  id: number
  type: 'parse'
  file: File
}

declare const self: DedicatedWorkerGlobalScope

const MINISTRY_COLUMN_HEADERS: string[] = [
  'الرقم الوزاري',
  'اسم المدرسة',
  'المدينة/القرية',
  'المنطقة الإدارية',
  'الترميز الموحد لإدارة التعليم',
  'إدارة التعليم',
  'المرحلة',
  'السلطة',
  'مكتب التعليم',
  'عدد المدارس',
  'تاريخ الانشاء في النظام',
  'جنس المدرسة',
  'نوع المدرسة',
  'نوع التعليم',
  'هوية مدير المدرسة',
  'اسم مدير المدرسة',
  'البريد الإلكتروني لمدير المدرسة',
  'بريد مدير المدرسة',
  'جوال مدير المدرسة',
  'صف1',
  'طلاب1',
  'سعودي1',
  'صف2',
  'طلاب2',
  'سعودي2',
  'صف3',
  'طلاب3',
  'سعودي3',
  'صف4',
  'طلاب4',
  'سعودي4',
  'صف5',
  'طلاب5',
  'سعودي5',
  'صف6',
  'طلاب6',
  'سعودي6',
  'صف7',
  'طلاب7',
  'سعودي7',
  'صف8',
  'طلاب8',
  'سعودي8',
  'صف9',
  'طلاب9',
  'سعودي9',
  'فصول جملة',
  'جملة طلاب',
  'جملة سعودي',
  'مستجدون',
  'مستجدون سعودي',
  'حجرات',
  'معلمين',
  'معلمين سعودي',
  'إداريون',
  'إداري سعودي',
  'خدم',
  'عمال',
  'مستقلة/ملحقة',
  'مباني حكومية',
  'مباني مستاجرة',
  'الإيجار',
  'الهاتف',
  'العنوان',
  'سنة التأسيس',
  'أقرب إبتدائية',
  'مسافة1',
  'حالة طريق1',
  'نفس المنطقة1',
  'أقرب متوسطة',
  'مسافة 2',
  'حالة طريق2',
  'نفس المنطقة2',
  'أقرب ثانوية',
  'مسافة3',
  'حالة طريق3',
  'نفس المنطقة3',
  'بعد إسفلت',
  'بعد ترابي',
  'بعد صخري',
  'البريد الإلكتروني',
  'عدد مديرو المدارس',
  'عدد الوكلاء',
  'عدد امناء المكتبة',
  'عدد محضري المختبر',
  'رقم المحافظة',
  'المحافظة',
  'رقم المركز الإداري',
  'المركز الإداري',
  'صندوق بريد',
  'الرمز البريدي',
  'عدد معامل الكمبيوتر',
  'عدد غرف اللغة الإنجليزية',
  'عدد غرف معامل الفيزياء',
  'عدد غرف معامل الكيمياء',
  'عدد غرف الخياطة',
  'عدد معامل الخياطة والتدبير المنزلي',
  'عدد القاعات_مقررات',
  'نوع الاشتراكي',
  'حالة الاستقلالية',
  'المدرسة الاساسية',
  'رقم وزاري للمدرسة المشتركة',
  'المدرسة نائية',
  'ترميز الادارة',
  'ترميز وحدة/قسم/مكتب',
  'رقم هوية المستخدم',
  'إسم المستثمر',
  'البريد الإلكتروني للمستثمر',
  'جوال المستثمر',
  'المنهج (للأجنبي)',
  'نوع الخطة',
  'هل الفصول مضمومة',
  'خط العرض',
  'خط الطول',
  'نظام المدرسة',
  'المدرسة باللغة الإنجليزية',
  'إدارة التعليم باللغة الإنجليزية',
  'ترميز الإدارة التعليمية',
  'ترميز المرحلة الدراسية',
  'رقم الإحداث',
  'اسم المدرسةالمرتبطة بإحداث',
  'نوع الإحداث',
  'حالة المدرسة',
  'تاريخ إغلاق المدرسة',
  'عدد الطلاب البنين في مدارس البنات',
  'عدد فصول البنين في مدارس البنات',
  'مسير رواتب',
  'رقم الترخيص',
  'السجل التجاري',
  'اسم المدرسة في الشهادة',
  'ضمن مجمع',
  'توجد مكتبة',
  'يوجد مقصف',
  'حالة الماء',
  'يوجد انترنت',
  'عدد السيارات',
  'عدد أمناء المصادر',
  'عدد رائدي النشاط',
  'عدد مسؤولي التسجيل',
  'عدد موجهي الطلاب',
  'هل المدرسة مسارات',
  'فئة التعليم',
  'هل المدرسة مدرسة طفولة مبكرة (نعم او لا)',
  'وقت الدراسة',
  'تصنيف موقع المدرسة',
  'ملكية المبنى',
  'رمز القطاع',
  'القطاع',
  'رمز القطاع الخاص بفارس',
  'الطاقة الإستيعابية',
  'عدد المعلمات اللواتي يدرسن الطلبة البنين المسندين في مدارس البنات',
  'الشريحة'
]

function indexToColumnLabel(index: number): string {
  let label = ''

  while (index > 0) {
    const remainder = (index - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    index = Math.floor((index - 1) / 26)
  }

  return label
}

export const COLUMN_HEADERS_MAP: Record<string, string> = Object.fromEntries(
  MINISTRY_COLUMN_HEADERS.map((label, index) => [indexToColumnLabel(index + 1), label])
)

function column(key: string, label: string, aliases: string[] = []): ColumnDefinition {
  return { key, label, aliases: [label, ...aliases] }
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: 'identity.id', label: 'الرقم الوزاري', aliases: ['الرقم الوزاري', 'الرقم الوزاري (ID)', 'ID', 'رقم الوزارة', 'رقم المدرسة'] },
  { key: 'identity.schoolName', label: 'اسم المدرسة', aliases: ['اسم المدرسة', 'المدرسة', 'اسم المدرسة/الروضة'] },
  { key: 'identity.cityVillage', label: 'المدينة/القرية', aliases: ['المدينة/القرية', 'المدينة', 'القرية', 'المدينة او القرية', 'المدينة أو القرية'] },
  { key: 'identity.administrativeRegion', label: 'المنطقة الإدارية', aliases: ['المنطقة الإدارية', 'المنطقة', 'النطاق الإداري', 'المنطقة التعليمية'] },
  { key: 'identity.unifiedCode', label: 'الترميز الموحد', aliases: ['الترميز الموحد لإدارة التعليم', 'الترميز الموحد', 'الترميز', 'ترميز الادارة'] },
  { key: 'identity.educationDepartment', label: 'إدارة التعليم', aliases: ['إدارة التعليم', 'ادارة التعليم', 'الإدارة التعليمية'] },
  { key: 'identity.stage', label: 'المرحلة', aliases: ['المرحلة', 'المرحلة الدراسية'] },
  { key: 'identity.authority', label: 'السلطة', aliases: ['السلطة', 'نوع السلطة'] },
  { key: 'identity.educationType', label: 'نوع التعليم', aliases: ['نوع التعليم', 'التعليم'] },
  { key: 'identity.studyTime', label: 'وقت الدراسة', aliases: ['وقت الدراسة', 'الدوام', 'الفترة الدراسية'] },
  { key: 'identity.gender', label: 'جنس المدرسة', aliases: ['جنس المدرسة', 'الجنس', 'بنين / بنات', 'جنس'] },
  { key: 'identity.foundingYear', label: 'سنة التأسيس', aliases: ['سنة التأسيس', ' العام الدراسي', 'التأسيس', 'سنة التأسيس'] },
  { key: 'identity.phone', label: 'الهاتف', aliases: ['الهاتف', 'رقم الهاتف', 'الجوال', 'تليفون المدرسة', 'الهاتف/الجوال'] },
  { key: 'identity.email', label: 'البريد الإلكتروني', aliases: ['البريد الإلكتروني', 'البريد', 'الإيميل', 'e-mail'] },
  { key: 'identity.mailAddress', label: 'العنوان البريدي', aliases: ['العنوان البريدي', 'البريد', 'عنوان المدرسة'] },

  { key: 'students.grade1', label: 'طلاب1', aliases: ['طلاب1', 'طلاب الصف 1', 'الصف الأول', 'الصف الاول', 'صف 1', 'صف1'] },
  { key: 'students.grade2', label: 'طلاب2', aliases: ['طلاب2', 'طلاب الصف 2', 'الصف الثاني', 'صف 2', 'صف2'] },
  { key: 'students.grade3', label: 'طلاب3', aliases: ['طلاب3', 'طلاب الصف 3', 'الصف الثالث', 'صف 3', 'صف3'] },
  { key: 'students.grade4', label: 'طلاب4', aliases: ['طلاب4', 'طلاب الصف 4', 'الصف الرابع', 'صف 4', 'صف4', 'AA', 'AJ'] },
  { key: 'students.saudi4', label: 'سعودي4', aliases: ['سعودي4', 'سعودي طلاب4', 'سعودي صف4', 'AB', 'AE'] },
  { key: 'students.grade5', label: 'طلاب5', aliases: ['طلاب5', 'طلاب الصف 5', 'الصف الخامس', 'صف 5', 'صف5', 'AG'] },
  { key: 'students.saudi5', label: 'سعودي5', aliases: ['سعودي5', 'سعودي طلاب5', 'سعودي صف5', 'AH'] },
  { key: 'students.grade6', label: 'طلاب6', aliases: ['طلاب6', 'طلاب الصف 6', 'الصف السادس', 'صف 6', 'صف6', 'AM'] },
  { key: 'students.saudi6', label: 'سعودي6', aliases: ['سعودي6', 'سعودي طلاب6', 'سعودي صف6', 'AK', 'AL'] },
  { key: 'students.grade7', label: 'طلاب7', aliases: ['طلاب7', 'طلاب الصف 7', 'الصف السابع', 'صف 7', 'صف7'] },
  { key: 'students.grade8', label: 'طلاب8', aliases: ['طلاب8', 'طلاب الصف 8', 'الصف الثامن', 'صف 8', 'صف8'] },
  { key: 'students.grade9', label: 'طلاب9', aliases: ['طلاب9', 'طلاب الصف 9', 'الصف التاسع', 'صف 9', 'صف9'] },
  { key: 'students.grade10', label: 'طلاب10', aliases: ['طلاب10', 'طلاب الصف 10', 'الصف العاشر', 'صف 10', 'صف10', 'AJ'] },
  { key: 'students.grade11', label: 'طلاب11', aliases: ['طلاب11', 'طلاب الصف 11', 'الصف الحادي عشر', 'صف 11', 'صف11'] },
  { key: 'students.grade12', label: 'طلاب12', aliases: ['طلاب12', 'طلاب الصف 12', 'الصف الثاني عشر', 'صف 12', 'صف12'] },
  { key: 'students.total', label: 'جملة طلاب', aliases: ['جملة طلاب', 'إجمالي الطلاب', 'عدد الطلاب', 'الطلاب', 'جملة الطلبة'] },
  { key: 'students.saudi', label: 'جملة سعودي', aliases: ['جملة سعودي', 'الطلاب السعوديون', 'السعوديون', 'إجمالي سعودي', 'عدد السعوديين'] },
  { key: 'students.saudi1', label: 'سعودي1', aliases: ['سعودي1', 'سعودي طلاب1', 'الطلاب السعوديون1', 'سعودي الصف 1', 'سعودي صف1'] },
  { key: 'students.saudi2', label: 'سعودي2', aliases: ['سعودي2', 'سعودي طلاب2', 'الطلاب السعوديون2', 'سعودي الصف 2', 'سعودي صف2'] },
  { key: 'students.saudi10', label: 'سعودي10', aliases: ['سعودي10', 'سعودي طلاب10', 'سعودي صف10'] },
  { key: 'students.saudi11', label: 'سعودي11', aliases: ['سعودي11', 'سعودي طلاب11', 'سعودي صف11'] },
  { key: 'students.saudi12', label: 'سعودي12', aliases: ['سعودي12', 'سعودي طلاب12', 'سعودي صف12'] },
  { key: 'students.saudiBus', label: 'سعودي حافلات', aliases: ['سعودي حافلات', 'سعودي الباص', 'حافلات سعودي'] },
  { key: 'students.newcomers', label: 'مستجدون', aliases: ['مستجدون', 'المستجدون', 'طلاب مستجدون', 'الطلبة المستجدون'] },
  { key: 'students.classes', label: 'فصول جملة', aliases: ['فصول جملة', 'عدد الفصول', 'الفصول', 'إجمالي الفصول'] },

  { key: 'staff.teachers', label: 'معلمين', aliases: ['معلمين', 'عدد المعلمين', 'المعلمون', 'هيئة التدريس'] },
  { key: 'staff.saudiTeachers', label: 'معلمين سعودي', aliases: ['معلمين سعودي', 'المعلمون السعوديون', 'معلمين سعوديين', 'عدد المعلمين السعوديين'] },
  { key: 'staff.admins', label: 'إداريون', aliases: ['إداريون', 'الإداريون', 'عدد الإداريين', 'الكادر الإداري'] },
  { key: 'staff.saudiAdmins', label: 'إداري سعودي', aliases: ['إداري سعودي', 'الإداريون السعوديون', 'إداريين سعوديين', 'عدد الإداريين السعوديين'] },
  { key: 'staff.guidance', label: 'الموجهين', aliases: ['الموجهين', 'المرشدين', 'عدد الموجهين', 'عدد المرشدين'] },
  { key: 'staff.agents', label: 'الوكلاء', aliases: ['الوكلاء', 'عدد الوكلاء', 'وكلاء المدرسة'] },
  { key: 'staff.managerName', label: 'مدير المدرسة', aliases: ['مدير المدرسة', 'اسم المدير', 'المدير', 'مدير المدرسة P', 'مدير المدرسة/الرئيس', 'اسم مدير المدرسة', 'اسم مديرة المدرسة', 'مديرة المدرسة', 'المديرة'] },
  { key: 'staff.managerId', label: 'هوية المدير', aliases: ['هوية المدير', 'هوية مدير المدرسة', 'رقم هوية المدير', 'هوية مدير المدرسة (الرقم الوطني)', 'الرقم الوطني للمدير', 'الهوية', 'رقم الهوية'] },
  { key: 'staff.managerPhone', label: 'جوال المدير', aliases: ['جوال المدير', 'جوال مدير المدرسة', 'هاتف المدير', 'هاتف مدير المدرسة', 'رقم جوال المدير', 'موبايل المدير', 'موبايل مدير المدرسة', 'رقم جوال مدير المدرسة'] },
  { key: 'staff.managerEmailOfficial', label: 'البريد الإلكتروني لمدير المدرسة', aliases: ['البريد الإلكتروني لمدير المدرسة', 'البريد الإلكتروني للمدير', 'البريد الالكتروني لمدير المدرسة', 'البريد الالكتروني للمدير', 'البريد الإلكتروني لمديرة المدرسة', 'البريد الالكتروني لمديرة المدرسة', 'ايميل مدير المدرسة', 'إيميل مدير المدرسة', 'ايميل المدير', 'إيميل المدير', 'بريد مدير المدرسة الرسمي', 'البريد الإلكتروني الرسمي'] },
  { key: 'staff.managerEmailPersonal', label: 'بريد مدير المدرسة', aliases: ['بريد مدير المدرسة', 'بريد المدير', 'بريد مدير المدرسة الشخصي', 'البريد الإلكتروني الشخصي', 'ايميل مدير المدرسة الشخصي', 'إيميل مدير المدرسة الشخصي'] },

  { key: 'facilities.computerLabs', label: 'عدد معامل الكمبيوتر', aliases: ['عدد معامل الكمبيوتر', 'معامل الكمبيوتر', 'معامل الحاسب', 'معامل الحاسب الآلي', 'أجهزة الحاسب', 'عدد معامل الكمبيوتر'] },
  { key: 'facilities.physicsLabs', label: 'مختبرات فيزياء', aliases: ['مختبرات فيزياء', 'معمل فيزياء', 'معامل الفيزياء', 'مختبر الفيزياء', 'عدد غرف معامل الفيزياء'] },
  { key: 'facilities.chemistryLabs', label: 'مختبرات كيمياء', aliases: ['مختبرات كيمياء', 'معمل كيمياء', 'معامل الكيمياء', 'مختبر الكيمياء', 'عدد غرف معامل الكيمياء'] },
  { key: 'facilities.englishRooms', label: 'غرف الإنجليزية', aliases: ['غرف الإنجليزية', 'غرف اللغة الإنجليزية', 'غرف الانجليزية', 'معامل اللغة الإنجليزية', 'عدد غرف اللغة الإنجليزية'] },
  { key: 'facilities.sewingRooms', label: 'غرف الخياطة', aliases: ['غرف الخياطة', 'عدد غرف الخياطة', 'غرف الخياطة والتدبير المنزلي'] },
  { key: 'facilities.homeEconomicsRooms', label: 'معامل التدبير المنزلي', aliases: ['معامل الخياطة والتدبير المنزلي', 'عدد معامل الخياطة والتدبير المنزلي', 'معامل التدبير المنزلي', 'غرف التدبير المنزلي'] },
  { key: 'facilities.internet', label: 'الإنترنت', aliases: ['الإنترنت', 'انترنت', 'الانترنت', 'الواي فاي', 'WiFi', 'يوجد انترنت'] },
  { key: 'facilities.cafeteria', label: 'المقصف', aliases: ['المقصف', 'كافيتريا', 'بوفيه', 'مطعم', 'يوجد مقصف'] },
  { key: 'facilities.water', label: 'الماء', aliases: ['الماء', 'مياه', 'خدمة المياه', 'شبكة المياه', 'حالة الماء', 'حالة المياه'] },

  { key: 'building.ownership', label: 'ملكية المبنى', aliases: ['ملكية المبنى', 'ملكية البناء', 'نوع الملكية', 'ملكية المبنى حكومي/مستأجر'] },
  { key: 'building.rent', label: 'الإيجار', aliases: ['الإيجار', 'قيمة الإيجار', 'الايجار', 'إيجار المبنى'] },
  { key: 'building.latitude', label: 'خط العرض', aliases: ['خط العرض', 'latitude', 'Latitude', 'دائرة العرض'] },
  { key: 'building.longitude', label: 'خط الطول', aliases: ['خط الطول', 'longitude', 'Longitude', 'خط الطول الجغرافي'] },
  { key: 'building.roadStatus', label: 'حالة الطريق', aliases: ['حالة الطريق', 'حالة الوصول', 'الطريق', 'وصف الطريق'] },
  { key: 'building.roadType', label: 'نوع الطريق', aliases: ['نوع الطريق', 'نوع الطريق', 'اسفلت', 'ترابي', 'صخري'] },
  { key: 'building.subscriptionType', label: 'نوع الاشتراك', aliases: ['نوع الاشتراك', 'الاشتراك', 'type الاشتراك'] },
  { key: 'building.independenceStatus', label: 'حالة الاستقلالية', aliases: ['حالة الاستقلالية', 'استقلالية', 'مستقلة', 'ملحقة'] },
  { key: 'building.nearestPrimaryDistance', label: 'المسافة عن أقرب ابتدائي', aliases: ['المسافة عن أقرب ابتدائي', 'المسافة لمدرسة ابتدائية', 'ابتدائي قريب'] },
  { key: 'building.nearestMiddleDistance', label: 'المسافة عن أقرب متوسط', aliases: ['المسافة عن أقرب متوسط', 'المسافة لمدرسة متوسطة', 'متوسط قريب'] },
  { key: 'building.nearestHighDistance', label: 'المسافة عن أقرب ثانوي', aliases: ['المسافة عن أقرب ثانوي', 'المسافة لمدرسة ثانوية', 'ثانوي قريب'] },

  { key: 'classification.earlyChildhood', label: 'هل المدرسة طفولة مبكرة', aliases: ['هل المدرسة طفولة مبكرة', 'طفولة مبكرة', 'مرحلة الطفولة المبكرة', 'روضة'] },
  { key: 'classification.pathways', label: 'هل المدرسة مسارات', aliases: ['هل المدرسة مسارات', 'مسارات', 'مدارس المسارات', 'نظام المسارات'] },

  column('students.schoolCount', 'عدد المدارس'),
  column('additional.createdAt', 'تاريخ الانشاء في النظام', ['تاريخ الإنشاء في النظام', 'تاريخ الانشاء']),
  column('identity.schoolType', 'نوع المدرسة', ['نوع المؤسسة', 'نوع المدرسة']),
  column('additional.educationOffice', 'مكتب التعليم', ['مكتب التعليم', 'مكتب الإشراف', 'مكتب التربية']),
  column('students.saudi3', 'سعودي3', ['سعودي3', 'سعودي طلاب3', 'سعودي صف3', 'الطلاب السعوديون3']),
  column('students.saudiNewcomers', 'مستجدون سعودي', ['مستجدون سعودي', 'المستجدون السعوديون', 'طلاب مستجدون سعوديون']),
  column('additional.rooms', 'حجرات', ['عدد الحجرات', 'عدد الغرف']),
  column('additional.serviceStaff', 'خدم', ['عدد الخدم', 'الخدم']),
  column('additional.workers', 'عمال', ['عدد العمال', 'العمال']),
  column('additional.governmentBuildings', 'مباني حكومية', ['عدد المباني الحكومية', 'المباني الحكومية']),
  column('additional.rentedBuildings', 'مباني مستاجرة', ['عدد المباني المستأجرة', 'المباني المستأجرة']),
  column('additional.address', 'العنوان', ['العنوان', 'عنوان المدرسة']),
  column('additional.nearestPrimary', 'أقرب إبتدائية', ['أقرب ابتدائية', 'المدرسة الابتدائية القريبة', 'أقرب مدرسة ابتدائية']),
  column('additional.distance1', 'مسافة1', ['مسافة1', 'مسافة 1', 'المسافة 1']),
  column('additional.roadStatus1', 'حالة طريق1', ['حالة طريق1', 'حالة الطريق 1', 'حالة طريق 1']),
  column('additional.sameRegion1', 'نفس المنطقة1', ['نفس المنطقة1', 'نفس المنطقة 1']),
  column('additional.nearestMiddle', 'أقرب متوسطة', ['أقرب متوسطة', 'المدرسة المتوسطة القريبة', 'أقرب مدرسة متوسطة']),
  column('additional.distance2', 'مسافة 2', ['مسافة 2', 'مسافة2', 'المسافة 2']),
  column('additional.roadStatus2', 'حالة طريق2', ['حالة طريق2', 'حالة الطريق 2', 'حالة طريق 2']),
  column('additional.sameRegion2', 'نفس المنطقة2', ['نفس المنطقة2', 'نفس المنطقة 2']),
  column('additional.nearestHigh', 'أقرب ثانوية', ['أقرب ثانوية', 'المدرسة الثانوية القريبة', 'أقرب مدرسة ثانوية']),
  column('additional.distance3', 'مسافة3', ['مسافة3', 'مسافة 3', 'المسافة 3']),
  column('additional.roadStatus3', 'حالة طريق3', ['حالة طريق3', 'حالة الطريق 3', 'حالة طريق 3']),
  column('additional.sameRegion3', 'نفس المنطقة3', ['نفس المنطقة3', 'نفس المنطقة 3']),
  column('additional.asphaltDistance', 'بعد إسفلت', ['بعد إسفلت', 'المسافة على الإسفلت']),
  column('additional.dirtDistance', 'بعد ترابي', ['بعد ترابي', 'المسافة على التراب']),
  column('additional.rockyDistance', 'بعد صخري', ['بعد صخري', 'المسافة على الصخر']),
  column('additional.managersCount', 'عدد مديرو المدارس', ['عدد مديرو المدارس', 'عدد مديري المدارس', 'عدد المديرين']),
  column('additional.librariansCount', 'عدد امناء المكتبة', ['عدد امناء المكتبة', 'عدد أمناء المكتبة', 'أمناء المكتبة']),
  column('additional.labPreparersCount', 'عدد محضري المختبر', ['عدد محضري المختبر', 'محضري المختبر', 'محضرو المختبرات']),
  column('additional.governorateNumber', 'رقم المحافظة', ['رقم المحافظة']),
  column('additional.governorate', 'المحافظة', ['المحافظة']),
  column('additional.administrativeCenterNumber', 'رقم المركز الإداري', ['رقم المركز الإداري']),
  column('additional.administrativeCenter', 'المركز الإداري', ['المركز الإداري']),
  column('additional.postalBox', 'صندوق بريد', ['صندوق بريد', 'ص.ب', 'صندوق البريد']),
  column('additional.postalCode', 'الرمز البريدي', ['الرمز البريدي']),
  column('additional.curriculumClassrooms', 'عدد القاعات_مقررات', ['عدد القاعات_مقررات', 'عدد القاعات مقررات', 'القاعات مقررات']),
  column('building.subscriptionType', 'نوع الاشتراكي', ['نوع الاشتراك', 'نوع الاشتراكي', 'الاشتراك']),
  column('additional.schoolBase', 'المدرسة الاساسية', ['المدرسة الاساسية', 'المدرسة الأساسية', 'المدرسة الأم']),
  column('additional.sharedSchoolMinistryNumber', 'رقم وزاري للمدرسة المشتركة', ['رقم وزاري للمدرسة المشتركة', 'الرقم الوزاري للمدرسة المشتركة']),
  column('additional.remote', 'المدرسة نائية', ['المدرسة نائية', 'مدرسة نائية', 'نائية']),
  column('additional.unitDepartmentOfficeCode', 'ترميز وحدة/قسم/مكتب', ['ترميز وحدة/قسم/مكتب', 'ترميز الوحدة', 'ترميز القسم', 'ترميز المكتب']),
  column('additional.userId', 'رقم هوية المستخدم', ['رقم هوية المستخدم', 'هوية المستخدم']),
  column('additional.investorName', 'إسم المستثمر', ['إسم المستثمر', 'اسم المستثمر']),
  column('additional.investorEmail', 'البريد الإلكتروني للمستثمر', ['البريد الإلكتروني للمستثمر', 'ايميل المستثمر', 'إيميل المستثمر']),
  column('additional.investorPhone', 'جوال المستثمر', ['جوال المستثمر']),
  column('additional.curriculum', 'المنهج (للأجنبي)', ['المنهج (للأجنبي)', 'المنهج للأجنبي', 'المنهج']),
  column('additional.planType', 'نوع الخطة', ['نوع الخطة', 'الخطة']),
  column('additional.classesMerged', 'هل الفصول مضمومة', ['هل الفصول مضمومة', 'الفصول مضمومة', 'فصول مضمومة']),
  column('additional.schoolSystem', 'نظام المدرسة', ['نظام المدرسة']),
  column('additional.englishSchoolName', 'المدرسة باللغة الإنجليزية', ['المدرسة باللغة الإنجليزية', 'اسم المدرسة بالإنجليزية', 'اسم المدرسة بالانجليزية']),
  column('additional.englishEducationDepartment', 'إدارة التعليم باللغة الإنجليزية', ['إدارة التعليم باللغة الإنجليزية', 'اسم الإدارة بالإنجليزية', 'اسم الادارة بالانجليزية']),
  column('additional.educationDepartmentCode', 'ترميز الإدارة التعليمية', ['ترميز الإدارة التعليمية', 'ترميز الادارة التعليمية']),
  column('additional.stageCode', 'ترميز المرحلة الدراسية', ['ترميز المرحلة الدراسية', 'ترميز المرحلة']),
  column('additional.coordinateNumber', 'رقم الإحداث', ['رقم الإحداث', 'رقم الاحداث']),
  column('additional.associatedCoordinateSchoolName', 'اسم المدرسةالمرتبطة بإحداث', ['اسم المدرسةالمرتبطة بإحداث', 'اسم المدرسة المرتبطة بإحداث', 'اسم المدرسة المرتبطة باحداث']),
  column('additional.coordinateType', 'نوع الإحداث', ['نوع الإحداث', 'نوع الاحداث']),
  column('additional.schoolStatus', 'حالة المدرسة', ['حالة المدرسة']),
  column('additional.closingDate', 'تاريخ إغلاق المدرسة', ['تاريخ إغلاق المدرسة', 'تاريخ الاغلاق']),
  column('additional.maleStudentsInGirlsSchools', 'عدد الطلاب البنين في مدارس البنات', ['عدد الطلاب البنين في مدارس البنات', 'الطلاب البنين في مدارس البنات']),
  column('additional.maleClassesInGirlsSchools', 'عدد فصول البنين في مدارس البنات', ['عدد فصول البنين في مدارس البنات', 'فصول البنين في مدارس البنات']),
  column('additional.payroll', 'مسير رواتب', ['مسير رواتب', 'مسير الرواتب']),
  column('additional.licenseNumber', 'رقم الترخيص', ['رقم الترخيص']),
  column('additional.commercialRegistration', 'السجل التجاري', ['السجل التجاري']),
  column('additional.certificateSchoolName', 'اسم المدرسة في الشهادة', ['اسم المدرسة في الشهادة']),
  column('additional.inComplex', 'ضمن مجمع', ['ضمن مجمع', 'المدرسة ضمن مجمع', 'مجمع']),
  column('additional.libraryExists', 'توجد مكتبة', ['توجد مكتبة', 'يوجد مكتبة', 'مكتبة']),
  column('additional.waterStatus', 'حالة الماء', ['حالة الماء', 'حالة المياه']),
  column('additional.cars', 'عدد السيارات', ['عدد السيارات', 'السيارات']),
  column('additional.resourceManagersCount', 'عدد أمناء المصادر', ['عدد أمناء المصادر', 'أمناء المصادر']),
  column('additional.activityLeadersCount', 'عدد رائدي النشاط', ['عدد رائدي النشاط', 'رواد النشاط']),
  column('additional.registrationOfficersCount', 'عدد مسؤولي التسجيل', ['عدد مسؤولي التسجيل', 'مسؤولي التسجيل']),
  column('staff.guidance', 'عدد موجهي الطلاب', ['عدد موجهي الطلاب', 'موجهي الطلاب', 'عدد الموجهين', 'الموجهين', 'المرشدين']),
  column('additional.educationCategory', 'فئة التعليم', ['فئة التعليم']),
  column('additional.siteClassification', 'تصنيف موقع المدرسة', ['تصنيف موقع المدرسة', 'تصنيف الموقع']),
  column('additional.sectorCode', 'رمز القطاع', ['رمز القطاع']),
  column('additional.sector', 'القطاع', ['القطاع']),
  column('additional.farisSectorCode', 'رمز القطاع الخاص بفارس', ['رمز القطاع الخاص بفارس', 'رمز فارس']),
  column('additional.capacity', 'الطاقة الإستيعابية', ['الطاقة الإستيعابية', 'الطاقة الاستيعابية', 'القدرة الاستيعابية']),
  column('additional.femaleTeachersTeachingAssignedMaleStudents', 'عدد المعلمات اللواتي يدرسن الطلبة البنين المسندين في مدارس البنات', ['عدد المعلمات اللواتي يدرسن الطلبة البنين المسندين في مدارس البنات', 'المعلمات اللواتي يدرسن الطلبة البنين المسندين في مدارس البنات']),
  column('additional.segment', 'الشريحة', ['الشريحة'])
]

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

function parseBoolean(value: unknown): boolean {
  const normalized = normalizeHeader(String(value ?? ''))

  return ['نعم', 'yes', 'true', '1', 'متاح', 'موجود', 'متوفر', 'فعال', 'يعمل', 'صالحه', 'صالحة'].includes(normalized)
}

function findColumnValue(row: Record<string, unknown>, aliases: string[]): string {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return cleanText(String(row[alias]))
    }
  }

  const normalizedAliases = aliases.map(normalizeHeader)
  const matchedKey = Object.keys(row).find(key => normalizedAliases.includes(normalizeHeader(key)))

  return matchedKey ? cleanText(String(row[matchedKey])) : ''
}

function setNestedValue(record: Record<string, unknown>, key: string, value: unknown) {
  const [parent, child] = key.split('.')

  if (!parent || !child) {
    return
  }

  const parentValue = record[parent]

  if (!parentValue || typeof parentValue !== 'object') {
    return
  }

  const parentRecord = parentValue as Record<string, unknown>
  parentRecord[child] = value
}

function createEmptySchool(sourceRow: number, raw: Record<string, unknown>): MinistrySchoolRecord {
  return {
    identity: {
      id: '',
      schoolName: '',
      schoolType: '',
      cityVillage: '',
      educationDepartment: '',
      administrativeRegion: '',
      unifiedCode: '',
      stage: '',
      authority: '',
      educationType: '',
      studyTime: '',
      gender: '',
      foundingYear: '',
      phone: '',
      email: '',
      mailAddress: ''
    },
    students: {
      grade1: 0,
      grade2: 0,
      grade3: 0,
      grade4: 0,
      grade5: 0,
      grade6: 0,
      grade7: 0,
      grade8: 0,
      grade9: 0,
      grade10: 0,
      grade11: 0,
      grade12: 0,
      total: 0,
      saudi: 0,
      newcomers: 0,
      gradeTotal: 0,
      gradeTotalMismatch: 0,
      classes: 0,
      saudi1: 0,
      saudi2: 0,
      saudi3: 0,
      saudi4: 0,
      saudi5: 0,
      saudi6: 0,
      saudi7: 0,
      saudi8: 0,
      saudi9: 0,
      saudi10: 0,
      saudi11: 0,
      saudi12: 0,
      saudiBus: 0,
      saudiNewcomers: 0
    },
    staff: {
      teachers: 0,
      saudiTeachers: 0,
      admins: 0,
      saudiAdmins: 0,
      guidance: 0,
      agents: 0,
      managerName: '',
      managerId: '',
      managerPhone: '',
      managerEmailOfficial: '',
      managerEmailPersonal: ''
    },
    facilities: {
      computerLabs: 0,
      physicsLabs: 0,
      chemistryLabs: 0,
      englishRooms: 0,
      sewingRooms: 0,
      homeEconomicsRooms: 0,
      internet: false,
      cafeteria: false,
      water: false
    },
    building: {
      ownership: '',
      rent: 0,
      latitude: 0,
      longitude: 0,
      roadStatus: '',
      roadType: '',
      subscriptionType: '',
      independenceStatus: '',
      nearestPrimaryDistance: 0,
      nearestMiddleDistance: 0,
      nearestHighDistance: 0
    },
    classification: {
      earlyChildhood: false,
      pathways: false
    },
    additional: {
      educationOffice: '',
      schoolCount: 0,
      createdAt: '',
      rooms: 0,
      serviceStaff: 0,
      workers: 0,
      governmentBuildings: 0,
      rentedBuildings: 0,
      address: '',
      nearestPrimary: '',
      distance1: 0,
      roadStatus1: '',
      sameRegion1: false,
      nearestMiddle: '',
      distance2: 0,
      roadStatus2: '',
      sameRegion2: false,
      nearestHigh: '',
      distance3: 0,
      roadStatus3: '',
      sameRegion3: false,
      asphaltDistance: 0,
      dirtDistance: 0,
      rockyDistance: 0,
      managersCount: 0,
      librariansCount: 0,
      labPreparersCount: 0,
      governorateNumber: '',
      governorate: '',
      administrativeCenterNumber: '',
      administrativeCenter: '',
      postalBox: '',
      postalCode: '',
      curriculumClassrooms: 0,
      schoolBase: '',
      sharedSchoolMinistryNumber: '',
      remote: false,
      unitDepartmentOfficeCode: '',
      userId: '',
      investorName: '',
      investorEmail: '',
      investorPhone: '',
      curriculum: '',
      planType: '',
      classesMerged: false,
      schoolSystem: '',
      englishSchoolName: '',
      englishEducationDepartment: '',
      educationDepartmentCode: '',
      stageCode: '',
      coordinateNumber: '',
      associatedCoordinateSchoolName: '',
      coordinateType: '',
      schoolStatus: '',
      closingDate: '',
      maleStudentsInGirlsSchools: 0,
      maleClassesInGirlsSchools: 0,
      payroll: '',
      licenseNumber: '',
      commercialRegistration: '',
      certificateSchoolName: '',
      inComplex: false,
      libraryExists: false,
      waterStatus: '',
      cars: 0,
      resourceManagersCount: 0,
      activityLeadersCount: 0,
      registrationOfficersCount: 0,
      studentCounselorsCount: 0,
      educationCategory: '',
      siteClassification: '',
      sectorCode: '',
      sector: '',
      farisSectorCode: '',
      capacity: 0,
      femaleTeachersTeachingAssignedMaleStudents: 0,
      segment: ''
    },
    raw,
    sourceRow
  }
}

function hasMeaningfulData(school: MinistrySchoolRecord): boolean {
  const mappedValues = [
    school.identity.id,
    school.identity.schoolName,
    school.identity.educationDepartment,
    school.identity.administrativeRegion,
    school.students.total,
    school.staff.teachers,
    school.staff.managerName,
    school.facilities.computerLabs,
    school.building.ownership
  ]

  return mappedValues.some((value) => {
    if (typeof value === 'number') {
      return value > 0
    }

    return cleanText(String(value ?? '')).length > 0
  }) || Object.values(school.raw).some(value => cleanText(String(value ?? '')).length > 0)
}

function mapRowToSchool(row: Record<string, unknown>, sourceRow: number): MinistrySchoolRecord {
  const school = createEmptySchool(sourceRow, row)
  const record = school as unknown as Record<string, unknown>

  for (const definition of COLUMN_DEFINITIONS) {
    const value = findColumnValue(row, definition.aliases)

    if (!value) {
      continue
    }

    const numericKeys = [
      'students.total', 'students.saudi', 'students.newcomers', 'students.saudiNewcomers', 'students.classes',
      'students.saudi1', 'students.saudi2', 'students.saudi3', 'students.saudi4', 'students.saudi5',
      'students.saudi6', 'students.saudi7', 'students.saudi8', 'students.saudi9',
      'students.saudiBus',
      'staff.teachers', 'staff.saudiTeachers', 'staff.admins', 'staff.saudiAdmins', 'staff.guidance', 'staff.agents',
      'facilities.computerLabs', 'facilities.physicsLabs', 'facilities.chemistryLabs', 'facilities.englishRooms',
      'building.rent', 'building.latitude', 'building.longitude',
      'building.nearestPrimaryDistance', 'building.nearestMiddleDistance', 'building.nearestHighDistance',
      'additional.schoolCount', 'additional.rooms', 'additional.serviceStaff', 'additional.workers',
      'additional.governmentBuildings', 'additional.rentedBuildings', 'additional.distance1', 'additional.distance2',
      'additional.distance3', 'additional.asphaltDistance', 'additional.dirtDistance', 'additional.rockyDistance',
      'additional.managersCount', 'additional.librariansCount', 'additional.labPreparersCount',
      'additional.curriculumClassrooms', 'additional.maleStudentsInGirlsSchools', 'additional.maleClassesInGirlsSchools',
      'additional.cars', 'additional.resourceManagersCount', 'additional.activityLeadersCount',
      'additional.registrationOfficersCount', 'additional.capacity',
      'additional.femaleTeachersTeachingAssignedMaleStudents'
    ]

    const booleanKeys = [
      'facilities.internet', 'facilities.cafeteria', 'facilities.water',
      'classification.earlyChildhood', 'classification.pathways',
      'additional.sameRegion1', 'additional.sameRegion2', 'additional.sameRegion3',
      'additional.remote', 'additional.classesMerged', 'additional.inComplex', 'additional.libraryExists'
    ]

    if (definition.key.startsWith('students.grade') || numericKeys.includes(definition.key)) {
      setNestedValue(record, definition.key, parseNumber(value))
      continue
    }

    if (booleanKeys.includes(definition.key)) {
      setNestedValue(record, definition.key, parseBoolean(value))
      continue
    }

    setNestedValue(record, definition.key, cleanText(String(value)))
  }

  const grades = [
    school.students.grade1,
    school.students.grade2,
    school.students.grade3,
    school.students.grade4,
    school.students.grade5,
    school.students.grade6,
    school.students.grade7,
    school.students.grade8,
    school.students.grade9,
    school.students.grade10,
    school.students.grade11,
    school.students.grade12
  ]

  school.students.gradeTotal = grades.reduce((sum, value) => sum + value, 0)
  school.students.gradeTotalMismatch = school.students.total ? Math.abs(school.students.gradeTotal - school.students.total) : 0

  return school
}

function extractHeaders(worksheet: XLSX.WorkSheet): string[] {
  const firstRow = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })[0] || []

  return firstRow
    .map(value => cleanText(String(value ?? '')))
    .filter(Boolean)
}

async function parseExcelFile(file: File): Promise<MinistryExcelPayload> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const firstSheetName = workbook.SheetNames[0] ?? ''

  if (!firstSheetName) {
    throw new Error('لا يحتوي الملف على أوراق بيانات')
  }

  const worksheet = workbook.Sheets[firstSheetName]!
  const headers = extractHeaders(worksheet)
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })
  const schools = rows
    .map((row, index) => mapRowToSchool(row, index + 2))
    .filter(hasMeaningfulData)

  if (!schools.length) {
    throw new Error('لم يتم العثور على بيانات مدارس متوافقة مع الصيغة الوزارية')
  }

  const warningCount = schools.filter(school => school.students.gradeTotalMismatch > 0).length

  return {
    schools,
    headers,
    warningCount
  }
}

self.onmessage = async (event: MessageEvent<WorkerParseRequest>) => {
  const { id, type, file } = event.data

  if (type !== 'parse') {
    return
  }

  try {
    const payload = await parseExcelFile(file)

    self.postMessage({
      id,
      type: 'parsed',
      payload
    })
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : 'حدث خطأ غير متوقع أثناء معالجة الملف'

    self.postMessage({
      id,
      type: 'error',
      message
    })
  }
}
