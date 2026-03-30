// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - i64 / u64', () => {
  describe('u64 support', () => {
    it('should normalize u64 values to decimal strings', () => {
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
        const scVal: ScVal = { switch: ScValType.SCV_U64, value }
        const result = normalizeScVal(scVal)
        expect(result).toHaveProperty('kind', 'primitive')
        expect(result).toHaveProperty('primitive', 'u64')
        expect(result.value).toBe(expected)
      })
    })

    it('should normalize u64 from objects with toString (Hyper-like)', () => {
      const hyper = { toString: () => '9999999999999999999' }
      const scVal: ScVal = { switch: ScValType.SCV_U64, value: hyper }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'u64')
      expect(result.value).toBe('9999999999999999999')
    })

    it('should normalize u64 from string values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_U64, value: '12345' }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('12345')
    })

    it('should return fallback for invalid u64 values', () => {
      const invalidCases = [
        null,
        undefined,
        'not-a-number',
        3.14,
        { toString: () => 'abc' },
      ]

      invalidCases.forEach((value) => {
        const scVal: ScVal = { switch: ScValType.SCV_U64, value }
        const result = normalizeScVal(scVal)
        expect(result.kind).toBe('unsupported')
        expect(result.variant).toBe(ScValType.SCV_U64)
      })
    })

    it('should return fallback for negative u64 values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_U64, value: BigInt('-1') }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
    })
  })

  describe('i64 support', () => {
    it('should normalize i64 values to decimal strings', () => {
      const testCases = [
        { value: BigInt('0'), expected: '0' },
        { value: BigInt('1'), expected: '1' },
        { value: BigInt('-1'), expected: '-1' },
        {
          value: BigInt('9223372036854775807'),
          expected: '9223372036854775807',
        }, // Max i64
        {
          value: BigInt('-9223372036854775808'),
          expected: '-9223372036854775808',
        }, // Min i64
      ]

      testCases.forEach(({ value, expected }) => {
        const scVal: ScVal = { switch: ScValType.SCV_I64, value }
        const result = normalizeScVal(scVal)
        expect(result).toHaveProperty('kind', 'primitive')
        expect(result).toHaveProperty('primitive', 'i64')
        expect(result.value).toBe(expected)
      })
    })

    it('should normalize i64 from objects with toString (Hyper-like)', () => {
      const hyper = { toString: () => '-42' }
      const scVal: ScVal = { switch: ScValType.SCV_I64, value: hyper }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-42')
    })

    it('should return fallback for out-of-range i64 values', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I64,
        value: BigInt('9223372036854775808'), // Max i64 + 1
      }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
    })

    it('should return fallback for invalid i64 values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_I64, value: null }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
      expect(result.variant).toBe(ScValType.SCV_I64)
    })
  })
})
