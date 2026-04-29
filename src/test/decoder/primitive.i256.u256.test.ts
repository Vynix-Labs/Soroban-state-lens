// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - i256 / u256', () => {
  describe('u256 support', () => {
    it('should normalize u256 zero', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U256,
        value: {
          hiHi: BigInt('0'),
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('0'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'u256')
      expect(result.value).toBe('0')
    })

    it('should normalize u256 loLo-only value', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U256,
        value: {
          hiHi: BigInt('0'),
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('12345678901234567890'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('12345678901234567890')
    })

    it('should normalize u256 max value', () => {
      // Max u256: 2^256 - 1 = all four 64-bit words set to their max unsigned representation
      const MAX_U64 = BigInt('18446744073709551615')
      const scVal: ScVal = {
        switch: ScValType.SCV_U256,
        value: {
          hiHi: MAX_U64,
          hiLo: MAX_U64,
          loHi: MAX_U64,
          loLo: MAX_U64,
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      // 2^256 - 1
      expect(result.value).toBe(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      )
    })

    it('should normalize u256 from SDK-like objects with property methods', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U256,
        value: {
          hiHi: () => ({ toString: () => '0' }),
          hiLo: () => ({ toString: () => '0' }),
          loHi: () => ({ toString: () => '1' }),
          loLo: () => ({ toString: () => '0' }),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      // 1 << 64
      expect(result.value).toBe('18446744073709551616')
    })

    it('should return fallback for invalid u256 values', () => {
      const invalidCases = [
        null,
        undefined,
        'not-an-object',
        {
          hiHi: 'abc',
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('0'),
        },
        { hiHi: BigInt('0'), hiLo: BigInt('0'), loHi: BigInt('0') }, // missing loLo
      ]

      invalidCases.forEach((value) => {
        const scVal: ScVal = { switch: ScValType.SCV_U256, value }
        const result = normalizeScVal(scVal)
        expect(result.kind).toBe('unsupported')
        expect(result.variant).toBe(ScValType.SCV_U256)
      })
    })
  })

  describe('i256 support', () => {
    it('should normalize i256 zero', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: BigInt('0'),
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('0'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result).toHaveProperty('primitive', 'i256')
      expect(result.value).toBe('0')
    })

    it('should normalize i256 positive value', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: BigInt('0'),
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('1000000000000'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('1000000000000')
    })

    it('should normalize i256 negative -1', () => {
      // -1 in i256: hiHi = -1, resting words are 2^64 - 1
      const MAX_U64 = BigInt('18446744073709551615')
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: BigInt('-1'),
          hiLo: MAX_U64,
          loHi: MAX_U64,
          loLo: MAX_U64,
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-1')
    })

    it('should normalize i256 max value', () => {
      // Max i256: 2^255 - 1
      const MAX_I64 = BigInt('9223372036854775807')
      const MAX_U64 = BigInt('18446744073709551615')
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: MAX_I64,
          hiLo: MAX_U64,
          loHi: MAX_U64,
          loLo: MAX_U64,
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe(
        '57896044618658097711785492504343953926634992332820282019728792003956564819967',
      )
    })

    it('should normalize i256 min value', () => {
      // Min i256: -2^255
      const MIN_I64 = BigInt('-9223372036854775808')
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: MIN_I64,
          hiLo: BigInt('0'),
          loHi: BigInt('0'),
          loLo: BigInt('0'),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe(
        '-57896044618658097711785492504343953926634992332820282019728792003956564819968',
      )
    })

    it('should normalize i256 from SDK-like objects with property methods', () => {
      const MAX_U64 = '18446744073709551615'
      const scVal: ScVal = {
        switch: ScValType.SCV_I256,
        value: {
          hiHi: () => ({ toString: () => '-1' }),
          hiLo: () => ({ toString: () => MAX_U64 }),
          loHi: () => ({ toString: () => MAX_U64 }),
          loLo: () => ({ toString: () => MAX_U64 }),
        },
      }
      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('kind', 'primitive')
      expect(result.value).toBe('-1')
    })

    it('should return fallback for invalid i256 values', () => {
      const scVal: ScVal = { switch: ScValType.SCV_I256, value: null }
      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('unsupported')
      expect(result.variant).toBe(ScValType.SCV_I256)
    })
  })
})
