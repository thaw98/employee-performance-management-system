import { addMonths, format } from 'date-fns'

export function calculateProbationEnd(startDateIso: string): string {
  return format(addMonths(new Date(startDateIso), 3), 'yyyy-MM-dd')
}
