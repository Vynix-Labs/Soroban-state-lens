import { describe, expect, it } from 'vitest'
import { isUnsupportedFallback } from '../../workers/decoder/isUnsupportedFallback'
import type { UnsupportedFallback } from '../../workers/decoder/normalizeScVal'

describe('isUnsupportedFallback', () => {
  describe('happy path', () => {
    it('returns true for a valid UnsupportedFallback with rawData', () => {
      const value: UnsupportedFallback = {
        __unsupported: true,
        variant: 'ScvU64',
        rawData: null,
      }
      expect(isUnsupportedFallback(value)).toBe(true)
    })

    it('returns true with non-null rawData', () => {
      const value: UnsupportedFallback = {
        __unsupported: true,
        variant: 'ScvContractInstance',
        rawData: { some: 'data' },
      }
      expect(isUnsupportedFallback(value)).toBe(true)
    })

    it('returns true with an empty-string variant', () => {
      const value: UnsupportedFallback = {
        __unsupported: true,
        variant: '',
        rawData: null,
      }
      expect(isUnsupportedFallback(value)).toBe(true)
    })
  })

  describe('invalid input', () => {
    it('returns false for null', () => {
      expect(isUnsupportedFallback(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isUnsupportedFallback(undefined)).toBe(false)
    })

    it('returns false for a number', () => {
      expect(isUnsupportedFallback(42)).toBe(false)
    })

    it('returns false for a string', () => {
      expect(isUnsupportedFallback('ScvU64')).toBe(false)
    })

    it('returns false for a boolean', () => {
      expect(isUnsupportedFallback(true)).toBe(false)
    })

    it('returns false for an array', () => {
      expect(isUnsupportedFallback([])).toBe(false)
    })
  })

  describe('edge cases – partial objects and wrong field types', () => {
    it('returns false when __unsupported is missing', () => {
      expect(isUnsupportedFallback({ variant: 'ScvU64', rawData: null })).toBe(
        false,
      )
    })

    it('returns false when variant is missing', () => {
      expect(
        isUnsupportedFallback({ __unsupported: true, rawData: null }),
      ).toBe(false)
    })

    it('returns false when __unsupported is false', () => {
      expect(
        isUnsupportedFallback({
          __unsupported: false,
          variant: 'ScvU64',
          rawData: null,
        }),
      ).toBe(false)
    })

    it('returns false when __unsupported is 1 (truthy but not true)', () => {
      expect(
        isUnsupportedFallback({
          __unsupported: 1,
          variant: 'ScvU64',
          rawData: null,
        }),
      ).toBe(false)
    })

    it('returns false when variant is a number instead of string', () => {
      expect(
        isUnsupportedFallback({
          __unsupported: true,
          variant: 42,
          rawData: null,
        }),
      ).toBe(false)
    })

    it('returns false when variant is null', () => {
      expect(
        isUnsupportedFallback({
          __unsupported: true,
          variant: null,
          rawData: null,
        }),
      ).toBe(false)
    })

    it('returns false for an empty object', () => {
      expect(isUnsupportedFallback({})).toBe(false)
    })
  })
})
