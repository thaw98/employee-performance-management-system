import type jsPDF from 'jspdf'

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
