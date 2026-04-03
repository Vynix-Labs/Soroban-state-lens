import { describe, expect, it } from 'vitest'
import { bytesToUtf8 } from '../../lib/format/bytesToUtf8'

describe('bytesToUtf8', () => {
  // ✅ Valid UTF-8
  it('decodes ASCII bytes to the correct string', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
    expect(bytesToUtf8(bytes)).toBe('Hello')
  })

  it('decodes multibyte UTF-8 (accented characters)', () => {
    // "café" encoded as UTF-8: c a f é(0xc3 0xa9)
    const bytes = new Uint8Array([99, 97, 102, 0xc3, 0xa9])
    expect(bytesToUtf8(bytes)).toBe('café')
  })

  it('decodes multibyte UTF-8 (emoji)', () => {
    // 🔥 U+1F525 → 0xF0 0x9F 0x94 0xA5
    const bytes = new Uint8Array([0xf0, 0x9f, 0x94, 0xa5])
    expect(bytesToUtf8(bytes)).toBe('🔥')
  })

  it('decodes a mix of ASCII and multibyte characters', () => {
    // "hi 🌍" → h(68) i(69) space(32) 🌍(0xF0 0x9F 0x8C 0x8D)
    const bytes = new Uint8Array([104, 105, 32, 0xf0, 0x9f, 0x8c, 0x8d])
    expect(bytesToUtf8(bytes)).toBe('hi 🌍')
  })

  // ❌ Invalid UTF-8
  it('returns null for invalid UTF-8 byte sequences', () => {
    // 0xff and 0xfe are not valid UTF-8 start bytes
    const bytes = new Uint8Array([0xff, 0xfe])
    expect(bytesToUtf8(bytes)).toBeNull()
  })

  it('returns null for a lone continuation byte', () => {
    // 0x80 is a continuation byte and cannot appear on its own
    const bytes = new Uint8Array([0x80])
    expect(bytesToUtf8(bytes)).toBeNull()
  })

  it('returns null for mixed valid and invalid bytes', () => {
    // "ok" followed by an invalid sequence
    const bytes = new Uint8Array([111, 107, 0xff])
    expect(bytesToUtf8(bytes)).toBeNull()
  })

  it('does not return a replacement-character string for invalid input', () => {
    const bytes = new Uint8Array([0xff, 0xfe])
    const result = bytesToUtf8(bytes)
    // Must be null — never a string silently containing U+FFFD replacement characters
    expect(result).toBeNull()
  })

  // ⚠️ Null / undefined / empty
  it('returns null for null input', () => {
    expect(bytesToUtf8(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(bytesToUtf8(undefined)).toBeNull()
  })

  it('returns null for an empty byte array', () => {
    expect(bytesToUtf8(new Uint8Array([]))).toBeNull()
  })

  // 🛡️ No-throw guarantee
  it('does not throw for any input', () => {
    expect(() => bytesToUtf8(null)).not.toThrow()
    expect(() => bytesToUtf8(undefined)).not.toThrow()
    expect(() => bytesToUtf8(new Uint8Array([]))).not.toThrow()
    expect(() => bytesToUtf8(new Uint8Array([0xff, 0xfe]))).not.toThrow()
    expect(() => bytesToUtf8(new Uint8Array([72, 101, 108, 108, 111]))).not.toThrow()
  })
})
