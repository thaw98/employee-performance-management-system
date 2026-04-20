const nrcPattern = /^\d{1,2}\/[A-Za-z]{2,10}\([A-Za-z]{1,3}\)\d{6}$/

export function isValidMyanmarNrc(value: string): boolean {
  return nrcPattern.test(value.trim())
}
