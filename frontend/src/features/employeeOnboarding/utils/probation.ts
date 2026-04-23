import { addMonths, format, parseISO } from 'date-fns'

/** @param months 1, 3, or 6 */
export function calculateProbationEnd(startDateIso: string, months: number): string {
  return format(addMonths(parseISO(startDateIso), months), 'yyyy-MM-dd')
}

/** Formats a YYYY-MM-DD string for UI (preset probation end). */
export function formatProbationEndDisplay(isoDateYmd: string): string {
  const t = isoDateYmd.trim()
  if (!t) return ''
  return format(parseISO(t), 'dd-MM-yyyy')
}
