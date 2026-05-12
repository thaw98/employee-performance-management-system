import axiosInstance from '../../app/axiosInstance'
import { downloadBlobFile } from '../../utils/downloadBlobFile'

export type PipReportFormat = 'pdf' | 'excel'

type PipReportFilters = {
  status?: string
  departmentId?: number
  startDate?: string
  endDate?: string
}

const getReportExtension = (format: PipReportFormat) => format === 'excel' ? 'xlsx' : 'pdf'

const getFilenameFromHeader = (contentDisposition?: string) => {
  if (!contentDisposition) return undefined
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''))
  const match = contentDisposition.match(/filename="?([^";]+)"?/i)
  return match?.[1]
}

const cleanParams = (params: Record<string, string | number | undefined>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
}

async function downloadPipReport(url: string, params: Record<string, string | number | undefined>, fallbackName: string) {
  const response = await axiosInstance.get<Blob>(url, {
    params: cleanParams(params),
    responseType: 'blob',
  })
  const filename = getFilenameFromHeader(response.headers['content-disposition']) ?? fallbackName
  downloadBlobFile(response.data, filename)
}

export function downloadIndividualPipReport(pipId: number, format: PipReportFormat) {
  return downloadPipReport(
    `/pips/${pipId}/report`,
    { format },
    `pip-${pipId}-report.${getReportExtension(format)}`,
  )
}

export function downloadPipSummaryReport(filters: PipReportFilters, format: PipReportFormat) {
  return downloadPipReport(
    '/pips/report/summary',
    { ...filters, format },
    `pip-summary-report.${getReportExtension(format)}`,
  )
}

export function downloadPipProgressReport(filters: Omit<PipReportFilters, 'status'>, format: PipReportFormat) {
  return downloadPipReport(
    '/pips/report/progress',
    { ...filters, format },
    `pip-progress-report.${getReportExtension(format)}`,
  )
}
