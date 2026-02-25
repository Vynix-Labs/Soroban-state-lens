import { describe, expect, it } from 'vitest'
import { normalizeTimeoutMs } from '../../lib/rpc/normalizeTimeoutMs'

describe('normalizeTimeoutMs', () => {
  it('returns integer timeout for numeric input', () => {
    expect(normalizeTimeoutMs(5000)).toBe(5000)
    expect(normalizeTimeoutMs(1500.9)).toBe(1500)
  })

  it('parses numeric strings', () => {
    expect(normalizeTimeoutMs('2000')).toBe(2000)
    expect(normalizeTimeoutMs(' 3000 ')).toBe(3000)
  })

  it('accepts bigint input', () => {
    expect(normalizeTimeoutMs(4000n as unknown)).toBe(4000)
  })

  it('falls back for invalid inputs', () => {
    expect(normalizeTimeoutMs(undefined)).toBe(10000)
    expect(normalizeTimeoutMs(null)).toBe(10000)
    expect(normalizeTimeoutMs('not-a-number')).toBe(10000)
  })

  it('rejects NaN, Infinity, zero, and negatives', () => {
    expect(normalizeTimeoutMs(NaN)).toBe(10000)
    expect(normalizeTimeoutMs(Infinity)).toBe(10000)
    expect(normalizeTimeoutMs(0)).toBe(10000)
    expect(normalizeTimeoutMs(-100)).toBe(10000)
  })

  it('uses provided fallback when invalid', () => {
    expect(normalizeTimeoutMs('abc', 1234)).toBe(1234)
  })
})
