import type jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const PDF_CONFIDENTIAL_LABEL = 'Ace Data Systems Ltd. | CONFIDENTIAL'

type PdfTextAlign = 'left' | 'center' | 'right'
type PdfRgb = readonly [number, number, number]

interface PdfBrandingOptions {
  align?: PdfTextAlign
  fontSize?: number
  margin?: number
  textColor?: PdfRgb
  x?: number
  y?: number
}

const defaultSlate: PdfRgb = [88, 99, 115]
const primaryDefault: PdfRgb = [37, 99, 235]

export function addPdfHeaderBranding(doc: jsPDF, options: PdfBrandingOptions = {}): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const {
    align = 'right',
    fontSize = 7,
    margin = 12.7,
    textColor = defaultSlate,
    x = align === 'right' ? pageWidth - margin : align === 'center' ? pageWidth / 2 : margin,
    y = 10,
  } = options

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.text(PDF_CONFIDENTIAL_LABEL, x, y, { align })
}

export function addPdfFooterBranding(doc: jsPDF, options: PdfBrandingOptions = {}): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const {
    align = 'center',
    fontSize = 7,
    margin = 12.7,
    textColor = defaultSlate,
    x = align === 'right' ? pageWidth - margin : align === 'center' ? pageWidth / 2 : margin,
    y = pageHeight - 5,
  } = options

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.text(PDF_CONFIDENTIAL_LABEL, x, y, { align })
}

export function addPdfProfessionalHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  options?: { margin?: number; primaryColor?: PdfRgb }
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const m = options?.margin ?? 14
  const primary = options?.primaryColor ?? primaryDefault

  doc.setFillColor(primary[0], primary[1], primary[2])
  doc.rect(0, 0, pageWidth, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(30, 41, 59)
  doc.text(title, pageWidth / 2, 22, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(subtitle, pageWidth / 2, 30, { align: 'center' })

  doc.setDrawColor(226, 232, 240)
  doc.line(m, 34, pageWidth - m, 34)

  addPdfHeaderBranding(doc, { margin: m, y: 12, textColor: [148, 163, 184] })
}

export function addPdfProfessionalFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  options?: { margin?: number; primaryColor?: PdfRgb }
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const m = options?.margin ?? 14

  const footerY = pageHeight - 10

  doc.setDrawColor(226, 232, 240)
  doc.line(m, footerY - 3, pageWidth - m, footerY - 3)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(PDF_CONFIDENTIAL_LABEL, m, footerY, { align: 'left' })

  doc.setFont('helvetica', 'normal')
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - m, footerY, { align: 'right' })
}

export function addPdfSectionHeader(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  options?: { color?: PdfRgb; width?: number }
): number {
  const primary = options?.color ?? primaryDefault
  const sectionWidth = options?.width ?? 182

  doc.setFillColor(primary[0], primary[1], primary[2])
  doc.rect(x, y - 4, 3, 12, 'F')

  doc.setFillColor(248, 250, 252)
  doc.rect(x + 3, y - 4, sectionWidth - 3, 12, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text(text.toUpperCase(), x + 10, y + 2)

  return y + 12
}

export function addPdfInfoTable(
  doc: jsPDF,
  startY: number,
  rows: string[][],
  options?: { marginLeft?: number; marginRight?: number }
): number {
  const mLeft = options?.marginLeft ?? 14
  const mRight = options?.marginRight ?? 14
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - mLeft - mRight
  const colWidth = usableWidth / 4

  autoTable(doc, {
    startY,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: colWidth },
      1: { cellWidth: colWidth },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: colWidth },
      3: { cellWidth: colWidth },
    },
    margin: { left: mLeft, right: mRight },
    tableWidth: usableWidth,
  })

  return (doc as any).lastAutoTable?.finalY ?? startY
}
