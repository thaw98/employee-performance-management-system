import { pattern } from 'mm-nrc'

export function isValidMyanmarNrc(value: string): boolean {
  return pattern.en.test(value)
}
