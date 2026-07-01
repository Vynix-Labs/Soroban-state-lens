// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - duration / timepoint', () => {
  describe('duration support', () => {
    it('should normalize duration values to decimal strings', () => {
      const testCases = [
        { value: BigInt('0'), expected: '0' },
        { value: BigInt('1'), expected: '1' },
        { value: BigInt('42'), expected: '42' },
        {
          value: BigInt('18446744073709551615'),
          expected: '18446744073709551615',
        }, // Max u64
      ]

      testCases.forEach(({ value, expected }) => {
        const scVal: ScVal = { switch: ScValType.SCV_DURATION, value }
        const result = normalizeScVal(scVal)
        expect(result).toHaveProperty('kind', 'primitive')
        expect(result).toHaveProperty('primitive', 'duration')
        expect(result.value).toBe(expected)
      })
    })

    it('should normalize zero duration', () => {
      const scVal: ScVal = { switch: ScValType.SCV_DURATION, value: BigInt('0') }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'duration')
      expect(result.value).toBe('0')
    })

    it('should normalize duration from objects with toString (Hyper-like)', () => {
      const hyper = { toString: () => '9999999999999999999' }
      const scVal: ScVal = { switch: ScValType.SCV_DURATION, value: hyper }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'duration')
      expect(result.value).toBe('9999999999999999999')
    })

    it('should normalize duration from string values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_DURATION, value: '12345' }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('12345')
    })

    it('should return fallback for invalid duration values', () => {
      const invalidCases = [
        null,
        undefined,
        'not-a-number',
        3.14,
        { toString: () => 'abc' },
      ]

      invalidCases.forEach((value) => {
        const scVal: ScVal = { switch: ScValType.SCV_DURATION, value }
        const result = normalizeScVal(scVal)
        expect(result.kind).toBe('unsupported')
        expect(result.variant).toBe(ScValType.SCV_DURATION)
      })
    })

    it('should return fallback for negative duration values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_DURATION, value: BigInt('-1') }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
    })
  })

  describe('timepoint support', () => {
    it('should normalize timepoint values to decimal strings', () => {
      const testCases = [
        { value: BigInt('0'), expected: '0' },
        { value: BigInt('1'), expected: '1' },
        { value: BigInt('42'), expected: '42' },
        {
          value: BigInt('18446744073709551615'),
          expected: '18446744073709551615',
        }, // Max u64
      ]

      testCases.forEach(({ value, expected }) => {
        const scVal: ScVal = { switch: ScValType.SCV_TIMEPOINT, value }
        const result = normalizeScVal(scVal)
        expect(result).toHaveProperty('kind', 'primitive')
        expect(result).toHaveProperty('primitive', 'timepoint')
        expect(result.value).toBe(expected)
      })
    })

    it('should normalize zero timepoint', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_TIMEPOINT,
        value: BigInt('0'),
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'timepoint')
      expect(result.value).toBe('0')
    })

    it('should normalize timepoint from objects with toString (Hyper-like)', () => {
      const hyper = { toString: () => '1234567890' }
      const scVal: ScVal = { switch: ScValType.SCV_TIMEPOINT, value: hyper }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'timepoint')
      expect(result.value).toBe('1234567890')
    })

    it('should normalize timepoint from string values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_TIMEPOINT, value: '12345' }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('12345')
    })

    it('should return fallback for invalid timepoint values', () => {
      const invalidCases = [
        null,
        undefined,
        'not-a-number',
        3.14,
        { toString: () => 'abc' },
      ]

      invalidCases.forEach((value) => {
        const scVal: ScVal = { switch: ScValType.SCV_TIMEPOINT, value }
        const result = normalizeScVal(scVal)
        expect(result.kind).toBe('unsupported')
        expect(result.variant).toBe(ScValType.SCV_TIMEPOINT)
      })
    })

    it('should return fallback for negative timepoint values', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_TIMEPOINT,
        value: BigInt('-1'),
      }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
    })
  })
})
