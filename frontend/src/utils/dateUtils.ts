/**
 * Formats a date string into DD/MM/YYYY format.
 * @param dateString The date string from the backend (e.g., "2026-04-08")
 * @returns Formatted date string "08/04/2026"
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (e) {
    return dateString
  }
}

/**
 * DD/MM/YYYY with slashes (e.g. 30/09/2026). Uses local calendar date for yyyy-mm-dd API values.
 */
export const formatDateDayMonthYear = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  try {
    const raw = dateString.trim()
    const date = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

function parseFlexibleDateTime(dateTimeString: string): Date | null {
  try {
    let date: Date

    if (dateTimeString.includes('/')) {
      const [datePart, timePart] = dateTimeString.split(' ')
      if (datePart && timePart) {
        const [dayStr, monthStr, yearStr] = datePart.split('/')
        const [hourStr, minuteStr] = timePart.split(':')
        date = new Date(
          parseInt(yearStr, 10),
          parseInt(monthStr, 10) - 1,
          parseInt(dayStr, 10),
          parseInt(hourStr, 10),
          parseInt(minuteStr, 10)
        )
      } else {
        const [dayStr, monthStr, yearStr] = dateTimeString.split('/')
        date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10))
      }
    } else {
      date = new Date(dateTimeString)
    }

    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Formats a date-time string into DD/MM/YYYY HH:MM format.
 * @param dateTimeString The date-time string from the backend
 */
export const formatDateTime = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '-'
  const date = parseFlexibleDateTime(dateTimeString)
  if (!date) return dateTimeString

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'

  const formattedHours = String(hours).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`
}

/**
 * DD/MM/YYYY with comma and 12h time including seconds (e.g. 03/05/2026, 6:54:33 PM).
 */
export const formatDateTimeWithSeconds = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '-'
  const date = parseFlexibleDateTime(dateTimeString)
  if (!date) return dateTimeString

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours12 = date.getHours()
  const ampm = hours12 >= 12 ? 'PM' : 'AM'
  hours12 = hours12 % 12
  hours12 = hours12 ? hours12 : 12

  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year}, ${hours12}:${minutes}:${seconds} ${ampm}`
}

/**
 * Remark timestamps: DD/MM/YYYY H:MM:SSAM/PM (e.g. 16/05/2026 10:20:36PM).
 */
export const formatRemarkDateTime = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '-'
  const date = parseFlexibleDateTime(dateTimeString)
  if (!date) return dateTimeString

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours12 = date.getHours()
  const ampm = hours12 >= 12 ? 'PM' : 'AM'
  hours12 = hours12 % 12
  hours12 = hours12 ? hours12 : 12

  const hours = String(hours12).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}${ampm}`
}
