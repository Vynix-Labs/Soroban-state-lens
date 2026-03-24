import { describe, expect, it } from 'vitest'
import { formatLedgerSequence } from '../../lib/format/formatLedgerSequence'

describe('formatLedgerSequence', () => {
  describe('Happy Path', () => {
    it('formats small positive number', () => {
      expect(formatLedgerSequence(1)).toBe('1')
      expect(formatLedgerSequence(999)).toBe('999')
    })

    it('formats large positive number with thousands groups', () => {
      expect(formatLedgerSequence(1000)).toBe('1,000')
      expect(formatLedgerSequence(1234567)).toBe('1,234,567')
    })

    it('formats bigint input consistently', () => {
      expect(formatLedgerSequence(123456789n)).toBe('123,456,789')
    })

    it('formats numeric string input consistently', () => {
      expect(formatLedgerSequence('1234567')).toBe('1,234,567')
      expect(formatLedgerSequence(' 5000 ')).toBe('5,000') // with whitespace
    })
  })

  describe('Invalid Input', () => {
    it('returns dash for zero', () => {
      expect(formatLedgerSequence(0)).toBe('-')
      expect(formatLedgerSequence(0n)).toBe('-')
      expect(formatLedgerSequence('0')).toBe('-')
    })

    it('returns dash for negative numbers', () => {
      expect(formatLedgerSequence(-1)).toBe('-')
      expect(formatLedgerSequence(-1234n)).toBe('-')
      expect(formatLedgerSequence('-500')).toBe('-')
    })

    it('returns dash for non-numeric strings', () => {
      expect(formatLedgerSequence('abc')).toBe('-')
      expect(formatLedgerSequence('123a')).toBe('-')
      expect(formatLedgerSequence('1,234')).toBe('-') // Commas not allowed in input string by BigInt
    })

    it('returns dash for empty or whitespace-only strings', () => {
      expect(formatLedgerSequence('')).toBe('-')
      expect(formatLedgerSequence('   ')).toBe('-')
    })

    it('returns dash for null/undefined-like values if passed (via type casting)', () => {
      // @ts-expect-error - testing runtime behavior for invalid types
      expect(formatLedgerSequence(null)).toBe('-')
      // @ts-expect-error
      expect(formatLedgerSequence(undefined)).toBe('-')
    })
  })

  describe('Edge Behavior', () => {
    it('handles very large ledger sequences', () => {
      // Ledger sequences are usually 32-bit uints, but we support any positive bigint
      const large = 2n ** 64n - 1n
      expect(formatLedgerSequence(large)).toBe('18,446,744,073,709,551,615')
    })
  })
})
