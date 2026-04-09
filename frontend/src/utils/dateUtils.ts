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
 * Formats a date-time string into DD/MM/YYYY HH:MM format.
 * @param dateTimeString The date-time string from the backend
 */
export const formatDateTime = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '-'
  try {
    let date: Date;

    // Check if format is dd/mm/yyyy
    if (dateTimeString.includes('/')) {
      const [datePart, timePart] = dateTimeString.split(' ');
      if (datePart && timePart) {
        const [dayStr, monthStr, yearStr] = datePart.split('/');
        const [hourStr, minuteStr] = timePart.split(':');
        date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hourStr), parseInt(minuteStr));
      } else {
        const [dayStr, monthStr, yearStr] = dateTimeString.split('/');
        date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
      }
    } else {
      date = new Date(dateTimeString)
    }

    if (isNaN(date.getTime())) return dateTimeString

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
  } catch (e) {
    return dateTimeString
  }
}
