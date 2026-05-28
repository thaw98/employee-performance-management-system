import { describe, expect, it, vi } from 'vitest'
import { addPdfFooterBranding, addPdfHeaderBranding, PDF_CONFIDENTIAL_LABEL } from './pdfBranding'

function createDocMock(width = 210, height = 297) {
  return {
    internal: {
      pageSize: {
        getWidth: () => width,
        getHeight: () => height,
      },
    },
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
  }
}

describe('pdfBranding', () => {
  it('renders the confidential label in the header area', () => {
    const doc = createDocMock()

    addPdfHeaderBranding(doc as never, { margin: 14, y: 12 })

    expect(doc.text).toHaveBeenCalledWith(PDF_CONFIDENTIAL_LABEL, 196, 12, { align: 'right' })
  })

  it('renders the confidential label in the footer area', () => {
    const doc = createDocMock()

    addPdfFooterBranding(doc as never, { margin: 14, y: 289 })

    expect(doc.text).toHaveBeenCalledWith(PDF_CONFIDENTIAL_LABEL, 105, 289, { align: 'center' })
  })
})
