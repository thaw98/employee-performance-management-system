import { describe, expect, it } from 'vitest'
import { resolveMediaSrc } from './mediaUrl'

describe('resolveMediaSrc', () => {
  it('returns data URLs unchanged', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
    expect(resolveMediaSrc(dataUrl)).toBe(dataUrl)
  })

  it('wraps raw base64 as a PNG data URL', () => {
    const raw = 'iVBORw0KGgo'.repeat(20)
    expect(resolveMediaSrc(raw)).toBe(`data:image/png;base64,${raw}`)
  })

  it('prefixes absolute upload paths with the backend origin', () => {
    expect(resolveMediaSrc('/uploads/signatures/abc.png')).toBe(
      'http://localhost:8080/uploads/signatures/abc.png',
    )
  })
})
