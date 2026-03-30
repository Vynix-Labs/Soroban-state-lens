import { describe, expect, it } from 'vitest'
import { formatScSymbol } from '../../lib/format/formatScSymbol'

describe('formatScSymbol', () => {
  // ✅ Happy paths
  it('returns trimmed symbol', () => {
    expect(formatScSymbol('  BTC ')).toBe('BTC')
  })

  it('preserves valid symbols', () => {
    expect(formatScSymbol('ETH')).toBe('ETH')
    expect(formatScSymbol('$USD')).toBe('$USD')
  })

  // ❌ Invalid input
  it("returns '?' for empty string", () => {
    expect(formatScSymbol('')).toBe('?')
  })

  it("returns '?' for whitespace-only string", () => {
    expect(formatScSymbol('   ')).toBe('?')
  })

  // ⚠️ Edge cases
  it("returns '?' if control characters are present", () => {
    expect(formatScSymbol('BTC\n')).toBe('?')
    expect(formatScSymbol('ETH\t')).toBe('?')
    expect(formatScSymbol('USD\u0000')).toBe('?')
  })

  it("returns '?' if input becomes empty after trim", () => {
    expect(formatScSymbol('\n\t')).toBe('?')
  })

  // Defensive (even though type says string)
  it("returns '?' for non-string input", () => {
    expect(formatScSymbol(null as unknown as string)).toBe('?')
    expect(formatScSymbol(undefined as unknown as string)).toBe('?')
  })
})
