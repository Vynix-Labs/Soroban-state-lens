import { describe, expect, it } from 'vitest'
import { bytesToBase64 } from '../../lib/format/bytesToBase64'

describe('bytesToBase64', () => {
  it('returns empty string for empty input', () => {
    expect(bytesToBase64(new Uint8Array([]))).toBe('')
  })

  it('returns empty string for null/undefined', () => {
    expect(bytesToBase64(null)).toBe('')
    expect(bytesToBase64(undefined)).toBe('')
  })

  it('converts short bytes to base64 consistently', () => {
    // "hello" in bytes
    const input = new Uint8Array([104, 101, 108, 108, 111])
    expect(bytesToBase64(input)).toBe('aGVsbG8=')
  })

  it('converts a representative longer payload to base64', () => {
    // A somewhat longer byte array to test chunking/Buffer path
    const text =
      'This is a test of the base64 encoding helper for Soroban State Lens.'
    const input = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) {
      input[i] = text.charCodeAt(i)
    }

    // Base64 encoding of the above string
    const expected =
      'VGhpcyBpcyBhIHRlc3Qgb2YgdGhlIGJhc2U2NCBlbmNvZGluZyBoZWxwZXIgZm9yIFNvcm9iYW4gU3RhdGUgTGVucy4='

    expect(bytesToBase64(input)).toBe(expected)
  })

  it('converts a large payload that exceeds standard call stack size', () => {
    // 200,000 bytes - enough to trigger maximum call stack size exceeded
    // if using String.fromCharCode(...bytes) without chunking
    const size = 200000
    const input = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      input[i] = i % 256
    }

    // We mainly want to ensure it doesn't throw and returns a string
    const result = bytesToBase64(input)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // The length should be roughly 4/3 of the input size, padded to multiple of 4
    expect(result.length).toBe(Math.ceil(size / 3) * 4)
  })
})
