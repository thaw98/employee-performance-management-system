import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function getSignatureErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const fbqError = error as FetchBaseQueryError & {
      data?: { message?: unknown }
      error?: string
    }
    if (typeof fbqError.data?.message === 'string' && fbqError.data.message.trim()) {
      return fbqError.data.message
    }
    if (typeof fbqError.error === 'string' && fbqError.error.trim()) return fbqError.error
    if (typeof fbqError.status === 'number') return `Request failed (HTTP ${fbqError.status}).`
    if (typeof fbqError.status === 'string' && fbqError.status.trim()) {
      return `Request failed (${fbqError.status}).`
    }
  }
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string' && data.message.trim()) return data.message
  }
  return fallback
}
