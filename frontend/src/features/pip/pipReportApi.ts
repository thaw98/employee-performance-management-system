import axiosInstance from '../../app/axiosInstance'
import { downloadBlobFile } from '../../utils/downloadBlobFile'

export type PipReportFormat = 'pdf' | 'excel'

type PipReportFilters = {
  status?: string
  departmentId?: number | null
  positionId?: number | null
  employeeName?: string
  employeeId?: number | null
  pipId?: number | null
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

const cleanParams = (params: Record<string, string | number | null | undefined>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
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

async function downloadPipReport(url: string, params: Record<string, string | number | null | undefined>, fallbackName: string) {
  try {
    const response = await axiosInstance.get<Blob>(url, {
      params: cleanParams(params),
      responseType: 'blob',
    })
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

export function downloadIndividualPipReport(pipId: number, format: PipReportFormat, fallbackName?: string) {
  return downloadPipReport(
    `/reports/pips/${pipId}`,
    { format },
    fallbackName ?? `pip-${pipId}-report.${getReportExtension(format)}`,
  )
}

export function downloadPipSummaryReport(filters: PipReportFilters, format: PipReportFormat) {
  return downloadPipReport(
    '/reports/pips/summary',
    { ...filters, format },
    `pip-summary-report.${getReportExtension(format)}`,
  )
}

export function downloadPipProgressReport(filters: PipReportFilters, format: PipReportFormat) {
  return downloadPipReport(
    '/reports/pips/progress',
    { ...filters, format },
    `pip-progress-report.${getReportExtension(format)}`,
  )
}

export function downloadPipSummaryReportExport(
  filters: PipReportFilters,
  format: PipReportFormat,
  fallbackName?: string
) {
  return downloadPipReport(
    '/reports/pips/summary',
    { ...filters, format },
    fallbackName ?? `pip-summary-report.${getReportExtension(format)}`,
  )
}

export function downloadPipProgressReportExport(
  filters: PipReportFilters,
  format: PipReportFormat,
  fallbackName?: string
) {
  return downloadPipReport(
    '/reports/pips/progress',
    { ...filters, format },
    fallbackName ?? `pip-progress-report.${getReportExtension(format)}`,
  )
}
