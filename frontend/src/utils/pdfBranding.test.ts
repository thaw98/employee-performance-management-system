import { describe, expect, it, vi } from 'vitest'
import { addPdfFooterBranding, addPdfHeaderBranding, addPdfHeaderLogo, PDF_CONFIDENTIAL_LABEL } from './pdfBranding'

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
    addImage: vi.fn(),
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

  describe('addPdfHeaderLogo', () => {
    it('calls doc.addImage with expected placement when logo data is provided', () => {
      const doc = createDocMock()
      const logoDataUrl = 'data:image/png;base64,abc123'

      addPdfHeaderLogo(doc as never, logoDataUrl)

      expect(doc.addImage).toHaveBeenCalledWith(logoDataUrl, 'PNG', 14, 5, 24, 12)
    })

    it('respects custom position and size options', () => {
      const doc = createDocMock()
      const logoDataUrl = 'data:image/png;base64,abc123'

      addPdfHeaderLogo(doc as never, logoDataUrl, { x: 10, y: 8, width: 30, height: 15 })

      expect(doc.addImage).toHaveBeenCalledWith(logoDataUrl, 'PNG', 10, 8, 30, 15)
    })

    it('uses JPEG format for non-png images', () => {
      const doc = createDocMock()
      const logoDataUrl = 'data:image/jpeg;base64,abc123'

      addPdfHeaderLogo(doc as never, logoDataUrl)

      expect(doc.addImage).toHaveBeenCalledWith(logoDataUrl, 'JPEG', 14, 5, 24, 12)
    })

    it('does not throw when doc.addImage fails', () => {
      const doc = createDocMock()
      doc.addImage.mockImplementation(() => { throw new Error('fail') })

      expect(() => {
        addPdfHeaderLogo(doc as never, 'data:image/png;base64,abc')
      }).not.toThrow()
    })
  })
})
