import { describe, expect, it } from 'vitest'
import { normalizeUnsupportedFallback } from '../../workers/decoder/normalizeUnsupportedFallback'
import type { UnsupportedFallback } from '../../workers/decoder/normalizeScVal'

describe('normalizeUnsupportedFallback', () => {
  describe('happy path – valid UnsupportedFallback input', () => {
    it('preserves variant and rawData when input is a valid fallback with null rawData', () => {
      const input: UnsupportedFallback = {
        __unsupported: true,
        variant: 'ScvU64',
        rawData: null,
      }
      const result = normalizeUnsupportedFallback(input)
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('ScvU64')
      expect(result.rawData).toBe(null)
    })

    it('preserves non-null rawData from a valid fallback', () => {
      const input: UnsupportedFallback = {
        __unsupported: true,
        variant: 'ScvContractInstance',
        rawData: { key: 'value' },
      }
      const result = normalizeUnsupportedFallback(input)
      expect(result.variant).toBe('ScvContractInstance')
      expect(result.rawData).toEqual({ key: 'value' })
    })

    it('preserves rawData when it is a number', () => {
      const input: UnsupportedFallback = {
        __unsupported: true,
        variant: 'ScvDuration',
        rawData: 42,
      }
      const result = normalizeUnsupportedFallback(input)
      expect(result.variant).toBe('ScvDuration')
      expect(result.rawData).toBe(42)
    })

    it('preserves empty-string variant', () => {
      const input: UnsupportedFallback = {
        __unsupported: true,
        variant: '',
        rawData: null,
      }
      const result = normalizeUnsupportedFallback(input)
      expect(result.variant).toBe('')
      expect(result.rawData).toBe(null)
    })
  })

  describe('invalid input – produces deterministic default', () => {
    it('returns default fallback for null', () => {
      const result = normalizeUnsupportedFallback(null)
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default fallback for undefined', () => {
      const result = normalizeUnsupportedFallback(undefined)
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default fallback for a number', () => {
      const result = normalizeUnsupportedFallback(99)
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default fallback for a string', () => {
      const result = normalizeUnsupportedFallback('ScvU64')
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default fallback for a boolean', () => {
      const result = normalizeUnsupportedFallback(false)
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default fallback for an array', () => {
      const result = normalizeUnsupportedFallback([])
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })
  })

  describe('edge cases – partial objects', () => {
    it('returns default when __unsupported is missing', () => {
      const result = normalizeUnsupportedFallback({ variant: 'ScvU64', rawData: null })
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('returns default when variant is missing', () => {
      const result = normalizeUnsupportedFallback({ __unsupported: true, rawData: null })
      expect(result.variant).toBe('unknown')
    })

    it('returns default when __unsupported is false', () => {
      const result = normalizeUnsupportedFallback({
        __unsupported: false,
        variant: 'ScvU64',
        rawData: null,
      })
      expect(result.variant).toBe('unknown')
    })

    it('returns default when variant is a number instead of string', () => {
      const result = normalizeUnsupportedFallback({
        __unsupported: true,
        variant: 99,
        rawData: null,
      })
      expect(result.variant).toBe('unknown')
    })

    it('returns default for an empty object', () => {
      const result = normalizeUnsupportedFallback({})
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe('unknown')
      expect(result.rawData).toBe(null)
    })

    it('always sets __unsupported to true regardless of input', () => {
      expect(normalizeUnsupportedFallback(null).__unsupported).toBe(true)
      expect(normalizeUnsupportedFallback(42).__unsupported).toBe(true)
      expect(normalizeUnsupportedFallback({}).__unsupported).toBe(true)
    })
  })
})
