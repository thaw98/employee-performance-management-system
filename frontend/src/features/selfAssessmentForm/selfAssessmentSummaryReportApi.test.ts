import { beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance from '../../app/axiosInstance'
import { downloadBlobFile } from '../../utils/downloadBlobFile'
import { downloadSelfAssessmentSummaryPdf } from './selfAssessmentSummaryReportApi'

vi.mock('../../app/axiosInstance', () => ({
  default: { get: vi.fn() },
}))

vi.mock('../../utils/downloadBlobFile', () => ({
  downloadBlobFile: vi.fn(),
}))

describe('selfAssessmentSummaryReportApi', () => {
  beforeEach(() => {
    vi.mocked(axiosInstance.get).mockReset()
    vi.mocked(downloadBlobFile).mockReset()
  })

  it('downloads the PDF blob from the selected cycle endpoint', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="summary.pdf"' },
    })

    await downloadSelfAssessmentSummaryPdf(7, 'Q2 2026')

    expect(axiosInstance.get).toHaveBeenCalledWith('/self-assessment-forms/score-records/export/pdf', {
      params: { cycleId: 7 },
      responseType: 'blob',
    })
    expect(downloadBlobFile).toHaveBeenCalledWith(blob, 'summary.pdf')
  })

  it('uses the suggested fallback filename when the server omits content disposition', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: blob, headers: {} })

    await downloadSelfAssessmentSummaryPdf(7, 'Q2 2026')

    expect(downloadBlobFile).toHaveBeenCalledWith(blob, 'self-assessment-summary-q2-2026.pdf')
  })
})
