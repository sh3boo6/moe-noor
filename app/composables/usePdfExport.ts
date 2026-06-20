import { jsPDF } from 'jspdf'
import autoTable, { type UserOptions } from 'jspdf-autotable'
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

const pdfFontFamily = 'IBM Plex Sans Arabic'
const regularFontFile = 'IBM-Plex-Sans-Arabic-400.ttf'
const boldFontFile = 'IBM-Plex-Sans-Arabic-700.ttf'

interface PdfFontData {
  regular: string
  bold: string
}

interface PdfDocumentWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number
  }
}

let pdfFontsLoaded = false
let pdfFontData: PdfFontData | null = null

function getFontUrls(fontFileName: string): string[] {
  const baseURL = useRuntimeConfig().app.baseURL?.replace(/\/$/, '') || ''
  const fontPath = `${baseURL}/fonts/${fontFileName}`

  return Array.from(new Set([
    new URL(fontPath, window.location.href).href,
    fontPath
  ]))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('فشل تحويل الخط إلى Base64'))
    reader.readAsDataURL(blob)
  })
}

async function fetchFontAsBase64(fontFileName: string): Promise<string> {
  let lastError: unknown = null

  for (const url of getFontUrls(fontFileName)) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        lastError = new Error(`تعذر تحميل الخط العربي من ${url}`)
        continue
      }

      return await blobToBase64(await response.blob())
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('تعذر تحميل الخط العربي')
}

async function loadPdfFonts(): Promise<PdfFontData> {
  if (pdfFontsLoaded && pdfFontData) {
    return pdfFontData
  }

  const [regular, bold] = await Promise.all([
    fetchFontAsBase64('ibm-plex-sans-arabic-400.ttf'),
    fetchFontAsBase64('ibm-plex-sans-arabic-700.ttf')
  ])

  pdfFontData = { regular, bold }
  pdfFontsLoaded = true
  return pdfFontData
}

function registerPdfFonts(doc: jsPDF, fonts: PdfFontData) {
  doc.addFileToVFS(regularFontFile, fonts.regular)
  doc.addFont(regularFontFile, pdfFontFamily, 'normal')
  doc.addFileToVFS(boldFontFile, fonts.bold)
  doc.addFont(boldFontFile, pdfFontFamily, 'bold')
  doc.setFont(pdfFontFamily)
}

function runAutoTable(doc: PdfDocumentWithAutoTable, options: UserOptions) {
  autoTable(doc, options)
}

type PdfTableRow = Array<string | number>

const ministryTableHeaders: PdfTableRow = ['اسم المدرسة', 'المرحلة', 'الجنس', 'السلطة', 'عدد الطلاب', 'عدد المعلمين', 'عدد الموظفين']
const genderTableHeaders: PdfTableRow = ['النوع', 'العدد', 'النسبة']
const facilityTableHeaders: PdfTableRow = ['المنطقة', 'معمل حاسوب', 'مختبر فيزياء', 'مختبر كيمياء']

function reverseRows(rows: PdfTableRow[]): PdfTableRow[] {
  return rows.map(row => [...row].reverse())
}

function buildMinistryTableData(schools: MinistrySchoolRecord[]): PdfTableRow[] {
  return schools.map(school => [
    school.identity.schoolName || 'غير محدد',
    school.identity.stage || 'غير محدد',
    school.identity.gender || 'غير محدد',
    school.identity.authority || 'غير محدد',
    (school.students.total || 0).toLocaleString('ar'),
    school.staff.teachers.toLocaleString('ar'),
    school.staff.admins.toLocaleString('ar')
  ])
}

function buildSummaryTableData(schools: MinistrySchoolRecord[]): PdfTableRow[] {
  const totalStudents = schools.reduce((sum, school) => sum + (school.students.total || 0), 0)
  const totalTeachers = schools.reduce((sum, school) => sum + school.staff.teachers, 0)
  const totalAdmins = schools.reduce((sum, school) => sum + school.staff.admins, 0)

  return reverseRows([
    ['إجمالي المدارس', schools.length.toLocaleString('ar')],
    ['إجمالي الطلاب', totalStudents.toLocaleString('ar')],
    ['إجمالي المعلمين', totalTeachers.toLocaleString('ar')],
    ['إجمالي الموظفين', totalAdmins.toLocaleString('ar')]
  ])
}

export function usePdfExport() {
  const exportMinistryReport = async (schools: MinistrySchoolRecord[], reportTitle?: string) => {
    const fonts = await loadPdfFonts()

    const doc: PdfDocumentWithAutoTable = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    registerPdfFonts(doc, fonts)

    doc.setFontSize(18)
    doc.text(reportTitle ?? 'تقرير وزارة التربية', 105, 20, { align: 'center' })

    doc.setFontSize(12)

    const tableData = buildMinistryTableData(schools)

    runAutoTable(doc, {
      head: [reverseRows([ministryTableHeaders])[0]!],
      body: reverseRows(tableData),
      startY: 30,
      theme: 'grid',
      styles: {
        font: pdfFontFamily,
        fontSize: 10,
        cellPadding: 3,
        halign: 'right'
      },
      columnStyles: {
        6: { fontStyle: 'bold', fillColor: [229, 231, 235] }
      },
      margin: { horizontal: 10 }
    })

    runAutoTable(doc, {
      body: buildSummaryTableData(schools),
      startY: (doc.lastAutoTable?.finalY ?? 30) + 10,
      theme: 'striped',
      styles: {
        font: pdfFontFamily,
        fontSize: 10,
        cellPadding: 4,
        halign: 'right'
      },
      columnStyles: {
        1: { fontStyle: 'bold', fillColor: [229, 231, 235] }
      },
      margin: { horizontal: 10 }
    })

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(`الصفحة ${i} من ${pageCount}`, 190, 285, { align: 'right' })
    }

    doc.save(`تقرير-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportChartsReport = async (schools: MinistrySchoolRecord[], chartsData: Record<string, unknown>) => {
    const fonts = await loadPdfFonts()

    const doc: PdfDocumentWithAutoTable = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    registerPdfFonts(doc, fonts)

    doc.setFontSize(16)
    doc.text((chartsData.title as string) ?? 'التقرير الإحصائي - وزارة التربية', 105, 20, { align: 'center' })

    let yPos = 35

    if (chartsData.genderDistribution && Array.isArray(chartsData.genderDistribution)) {
      doc.setFontSize(12)
      doc.text('توزيع المدارس حسب الجنس', 195, yPos, { align: 'right' })
      yPos += 5

      const genderData: PdfTableRow[] = (chartsData.genderDistribution as Array<{
        label: string
        count: number
        percentage: number
      }>).map(d => [
        d.label,
        d.count.toLocaleString('ar'),
        `${d.percentage.toFixed(1)}%`
      ])

      runAutoTable(doc, {
        head: [reverseRows([genderTableHeaders])[0]!],
        body: reverseRows(genderData),
        startY: yPos,
        theme: 'striped',
        styles: {
          font: pdfFontFamily,
          fontSize: 10,
          cellPadding: 3,
          halign: 'right'
        },
        margin: { horizontal: 15 }
      })

      yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10
    }

    if (chartsData.facilityRegions && Array.isArray(chartsData.facilityRegions)) {
      doc.text('توافر المعامل حسب المنطقة', 195, yPos, { align: 'right' })
      yPos += 5

      const facilityData: PdfTableRow[] = (chartsData.facilityRegions as Array<{
        region: string
        computerLabs: number
        physicsLabs: number
        chemistryLabs: number
      }>).map(d => [
        d.region,
        d.computerLabs.toLocaleString('ar'),
        d.physicsLabs.toLocaleString('ar'),
        d.chemistryLabs.toLocaleString('ar')
      ])

      runAutoTable(doc, {
        head: [reverseRows([facilityTableHeaders])[0]!],
        body: reverseRows(facilityData),
        startY: yPos,
        theme: 'striped',
        styles: {
          font: pdfFontFamily,
          fontSize: 10,
          cellPadding: 3,
          halign: 'right'
        },
        margin: { horizontal: 15 }
      })
    }

    doc.save(`تقرير-احصائي-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const openPdfInNewTab = async (schools: MinistrySchoolRecord[], reportTitle?: string) => {
    const fonts = await loadPdfFonts()

    const doc: PdfDocumentWithAutoTable = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    registerPdfFonts(doc, fonts)

    doc.setFontSize(18)
    doc.text(reportTitle ?? 'تقرير وزارة التربية', 105, 20, { align: 'center' })

    const tableData = buildMinistryTableData(schools)

    runAutoTable(doc, {
      head: [reverseRows([ministryTableHeaders])[0]!],
      body: reverseRows(tableData),
      startY: 30,
      theme: 'grid',
      styles: {
        font: pdfFontFamily,
        fontSize: 10,
        cellPadding: 3,
        halign: 'right'
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      columnStyles: {
        6: { fontStyle: 'bold', fillColor: [229, 231, 235] }
      },
      margin: { horizontal: 10 }
    })

    window.open(doc.output('bloburl'), '_blank')
  }

  return {
    exportMinistryReport,
    exportChartsReport,
    openPdfInNewTab
  }
}
