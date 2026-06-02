import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  loadPdfLogo,
  addPdfProfessionalHeader,
  addPdfProfessionalFooter,
} from './pdfBranding'
import type { EmployeeListItem } from '../features/hrEmployeeList/hrEmployeeApi'

export interface ExportEmployeeListPdfOptions {
  employees: EmployeeListItem[]
  search?: string
  departmentId?: number
  positionId?: number
  employmentStatus?: string
  departments?: { departmentId: number; departmentName: string }[]
  positions?: { positionId: number; positionName: string }[]
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

const formatDate = (date: Date): string => {
  const d = pad2(date.getDate())
  const m = pad2(date.getMonth() + 1)
  const y = String(date.getFullYear())
  return `${d}/${m}/${y}`
}

const formatFilenameDate = (date: Date): string => {
  const d = pad2(date.getDate())
  const m = pad2(date.getMonth() + 1)
  const y = String(date.getFullYear())
  return `${y}-${m}-${d}`
}

export async function exportEmployeeListPdf(options: ExportEmployeeListPdfOptions): Promise<void> {
  const {
    employees,
    search,
    departmentId,
    positionId,
    employmentStatus,
    departments,
    positions,
  } = options

  const now = new Date()
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  const logoDataUrl = await loadPdfLogo()

  addPdfProfessionalHeader(doc, 'Employee List', `Exported on ${formatDate(now)}`, {
    margin,
    logoDataUrl,
  })

  let y = 40

  const filterParts: string[] = []
  if (search?.trim()) filterParts.push(`Search: "${search.trim()}"`)
  if (departmentId && departments?.length) {
    const dept = departments.find((d) => d.departmentId === departmentId)
    if (dept) filterParts.push(`Department: ${dept.departmentName}`)
  }
  if (positionId && positions?.length) {
    const pos = positions.find((p) => p.positionId === positionId)
    if (pos) filterParts.push(`Position: ${pos.positionName}`)
  }
  if (employmentStatus) filterParts.push(`Status: ${employmentStatus}`)

  if (filterParts.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Filters: ${filterParts.join(' | ')}`, pageWidth / 2, y, { align: 'center' })
    y += 7
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(`Total Employees: ${employees.length}`, margin, y)
  y += 8

  const tableHead = [['No', 'Staff No', 'Name', 'Department', 'Position', 'Employment Status', 'Email', 'Phone']]
  const tableBody = employees.map((emp, index) => [
    String(index + 1),
    emp.staffNo,
    emp.employeeName,
    emp.departmentName,
    emp.positionName,
    emp.employmentStatus,
    emp.email,
    emp.phoneNumber || '-',
  ])

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 48 },
      3: { cellWidth: 38 },
      4: { cellWidth: 42 },
      5: { cellWidth: 26 },
      6: { cellWidth: 50 },
      7: { cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
  })

  const pageCount = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber)
    addPdfProfessionalFooter(doc, pageNumber, pageCount, { margin })
  }

  doc.save(`employee_list_${formatFilenameDate(now)}.pdf`)
}
