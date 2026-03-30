// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - i128 / u128', () => {
  describe('u128 support', () => {
    it('should normalize u128 zero', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U128,
        value: { hi: BigInt('0'), lo: BigInt('0') },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'u128')
      expect(result.value).toBe('0')
    })

    it('should normalize u128 lo-only value', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U128,
        value: { hi: BigInt('0'), lo: BigInt('12345678901234567890') },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('12345678901234567890')
    })

    it('should normalize u128 max value', () => {
      // Max u128: 2^128 - 1 = (2^64 - 1) << 64 | (2^64 - 1)
      const scVal: ScVal = {
        switch: ScValType.SCV_U128,
        value: {
          hi: BigInt('18446744073709551615'),
          lo: BigInt('18446744073709551615'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('340282366920938463463374607431768211455')
    })

    it('should normalize u128 from SDK-like objects with hi()/lo() methods', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U128,
        value: {
          hi: () => ({ toString: () => '1' }),
          lo: () => ({ toString: () => '0' }),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('18446744073709551616') // 1 << 64
    })

    it('should return fallback for invalid u128 values', () => {
      const invalidCases = [
        null,
        undefined,
        'not-an-object',
        { hi: 'abc', lo: BigInt('0') },
        { hi: BigInt('0') }, // missing lo
      ]

      invalidCases.forEach((value) => {
        const scVal: ScVal = { switch: ScValType.SCV_U128, value }
        const result = normalizeScVal(scVal)
        expect(result.kind).toBe('unsupported')
        expect(result.variant).toBe(ScValType.SCV_U128)
      })
    })
  })

  describe('i128 support', () => {
    it('should normalize i128 zero', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: { hi: BigInt('0'), lo: BigInt('0') },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'i128')
      expect(result.value).toBe('0')
    })

    it('should normalize i128 positive value', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: { hi: BigInt('0'), lo: BigInt('1000000000000') },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('1000000000000')
    })

    it('should normalize i128 negative -1', () => {
      // -1 in i128: hi = -1, lo = 2^64 - 1
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: {
          hi: BigInt('-1'),
          lo: BigInt('18446744073709551615'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-1')
    })

    it('should normalize i128 max value', () => {
      // Max i128: 2^127 - 1
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: {
          hi: BigInt('9223372036854775807'), // Max i64
          lo: BigInt('18446744073709551615'), // Max u64
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('170141183460469231731687303715884105727')
    })

    it('should normalize i128 min value', () => {
      // Min i128: -2^127
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: {
          hi: BigInt('-9223372036854775808'), // Min i64
          lo: BigInt('0'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-170141183460469231731687303715884105728')
    })

    it('should normalize i128 from SDK-like objects with hi()/lo() methods', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I128,
        value: {
          hi: () => ({ toString: () => '-1' }),
          lo: () => ({ toString: () => '18446744073709551615' }),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-1')
    })

    it('should return fallback for invalid i128 values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_I128, value: null }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
      expect(result.variant).toBe(ScValType.SCV_I128)
    })
  })
})
