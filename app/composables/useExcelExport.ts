import * as XLSX from 'xlsx'
import type { MinistrySchoolRecord } from '~/types/ministrySchool'

export interface ExcelColumn {
  key: string
  label: string
  getValue: (school: MinistrySchoolRecord) => unknown
}

export function useExcelExport() {
  function exportToExcel(schools: MinistrySchoolRecord[], columns: ExcelColumn[]) {
    const headers = columns.map(column => column.label)
    const rows = schools.map(school =>
      columns.map((column) => {
        const value = column.getValue(school)
        if (value === null || value === undefined || value === '') {
          return 'غير محدد'
        }
        if (typeof value === 'number') {
          return value
        }
        return String(value)
      })
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المدارس')
    const fileName = `جدول-المدارس-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return {
    exportToExcel
  }
}
