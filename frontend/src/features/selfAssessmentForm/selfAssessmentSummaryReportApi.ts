import axiosInstance from '../../app/axiosInstance'
import { downloadBlobFile } from '../../utils/downloadBlobFile'

const getFilenameFromHeader = (contentDisposition?: string) => {
  if (!contentDisposition) return undefined
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''))
  const match = contentDisposition.match(/filename="?([^";]+)"?/i)
  return match?.[1]
}

const slugifyFilenamePart = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'cycle'
}

async function getBlobErrorMessage(error: unknown) {
  const data = (error as any)?.response?.data
  if (!(data instanceof Blob)) {
    return (error as any)?.response?.data?.message
  }
  const text = await data.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)?.message
  } catch {
    return text
  }
}

export async function downloadSelfAssessmentSummaryPdf(cycleId: number, cycleName?: string | null) {
  try {
    const response = await axiosInstance.get<Blob>('/self-assessment-forms/score-records/export/pdf', {
      params: { cycleId },
      responseType: 'blob',
    })
    const fallbackName = `self-assessment-summary-${slugifyFilenamePart(cycleName || String(cycleId))}.pdf`
    const filename = getFilenameFromHeader(response.headers['content-disposition']) ?? fallbackName
    downloadBlobFile(response.data, filename)
  } catch (error) {
    const message = await getBlobErrorMessage(error)
    if (message) {
      ;(error as any).response = { ...(error as any).response, data: { message } }
    }
    throw error
  }
}
