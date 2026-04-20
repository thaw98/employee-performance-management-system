import { format } from 'date-fns'

export function formatBusinessDate(value: string | Date): string {
  return format(new Date(value), 'dd MMM yyyy')
}

export function formatBusinessTime(value: string | Date): string {
  return format(new Date(value), 'h:mm a')
}
