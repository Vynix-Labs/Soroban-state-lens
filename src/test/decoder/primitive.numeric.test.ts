import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { ScVal, UnsupportedFallback } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - Numeric Primitives', () => {
  describe('i32 support', () => {
    it('should normalize valid i32 values correctly', () => {
      const testCases = [
        { value: 0, expected: 0 },
        { value: 1, expected: 1 },
        { value: -1, expected: -1 },
        { value: 2147483647, expected: 2147483647 }, // Max i32
        { value: -2147483648, expected: -2147483648 }, // Min i32
        { value: 42, expected: 42 },
        { value: -42, expected: -42 },
      ]

      testCases.forEach(({ value, expected }) => {
        const scVal: ScVal = {
          switch: ScValType.SCV_I32,
          value,
        }
        const result = normalizeScVal(scVal)
        expect(result).toBe(expected)
      })
    })

    it('should return fallback for invalid i32 values', () => {
      const invalidCases = [
        { value: 2147483648, expected: 2147483648 }, // Max i32 + 1
        { value: -2147483649, expected: -2147483649 }, // Min i32 - 1
        { value: 3.14, expected: 3.14 }, // Float
        { value: 'not a number', expected: 'not a number' }, // String
        { value: null, expected: null }, // Null
        { value: undefined, expected: null }, // Undefined -> null
      ]

      invalidCases.forEach(({ value, expected }) => {
        const scVal: ScVal = {
          switch: ScValType.SCV_I32,
          value,
        }
        const result = normalizeScVal(scVal) as UnsupportedFallback
        expect(result.__unsupported).toBe(true)
        expect(result.variant).toBe(ScValType.SCV_I32)
        expect(result.rawData).toBe(expected)
      })
    })
  })

  describe('u32 support', () => {
    it('should normalize valid u32 values correctly', () => {
      const testCases = [
        { value: 0, expected: 0 },
        { value: 1, expected: 1 },
        { value: 4294967295, expected: 4294967295 }, // Max u32
        { value: 42, expected: 42 },
        { value: 1000000, expected: 1000000 },
      ]

      testCases.forEach(({ value, expected }) => {
        const scVal: ScVal = {
          switch: ScValType.SCV_U32,
          value,
        }
        const result = normalizeScVal(scVal)
        expect(result).toBe(expected)
      })
    })

    it('should return fallback for invalid u32 values', () => {
      const invalidCases = [
        { value: -1, expected: -1 }, // Negative
        { value: 4294967296, expected: 4294967296 }, // Max u32 + 1
        { value: 3.14, expected: 3.14 }, // Float
        { value: 'not a number', expected: 'not a number' }, // String
        { value: null, expected: null }, // Null
        { value: undefined, expected: null }, // Undefined -> null
      ]

      invalidCases.forEach(({ value, expected }) => {
        const scVal: ScVal = {
          switch: ScValType.SCV_U32,
          value,
        }
        const result = normalizeScVal(scVal) as UnsupportedFallback
        expect(result.__unsupported).toBe(true)
        expect(result.variant).toBe(ScValType.SCV_U32)
        expect(result.rawData).toBe(expected)
      })
    })
  })

  describe('unsupported fallback behavior', () => {
    it('should return stable fallback for unsupported variants', () => {
      const unsupportedVariants = [
        ScValType.SCV_U64,
        ScValType.SCV_I64,
        ScValType.SCV_U128,
        ScValType.SCV_I128,
        ScValType.SCV_BYTES,
        ScValType.SCV_VEC,
        ScValType.SCV_MAP,
      ]

      unsupportedVariants.forEach((variant) => {
        const scVal: ScVal = {
          switch: variant,
          value: 'test-data',
        }
        const result = normalizeScVal(scVal) as UnsupportedFallback
        expect(result.__unsupported).toBe(true)
        expect(result.variant).toBe(variant)
        expect(result.rawData).toBe('test-data')
      })
    })

    it('should handle missing or null raw data in fallback', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_U64,
        // No value property
      }
      const result = normalizeScVal(scVal) as UnsupportedFallback
      expect(result.__unsupported).toBe(true)
      expect(result.variant).toBe(ScValType.SCV_U64)
      expect(result.rawData).toBe(null)
    })

    it('should return deterministic fallback objects', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_BYTES,
        value: [1, 2, 3],
      }
      
      const result1 = normalizeScVal(scVal) as UnsupportedFallback
      const result2 = normalizeScVal(scVal) as UnsupportedFallback
      
      expect(result1).toEqual(result2)
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
    })
  })

  describe('edge cases', () => {
    it('should handle invalid ScVal input', () => {
      const invalidInputs = [
        { input: null, expectedVariant: 'Invalid' },
        { input: undefined, expectedVariant: 'Invalid' },
        { input: {}, expectedVariant: 'Invalid' },
        { input: { switch: null }, expectedVariant: 'Invalid' },
        { input: { switch: 'InvalidType' }, expectedVariant: 'InvalidType' },
      ]

      invalidInputs.forEach(({ input, expectedVariant }) => {
        const result = normalizeScVal(input as any) as UnsupportedFallback
        expect(result.__unsupported).toBe(true)
        expect(result.variant).toBe(expectedVariant)
      })
    })

    it('should handle supported types with correct values', () => {
      const supportedCases = [
        { switch: ScValType.SCV_BOOL, value: true, expected: true },
        { switch: ScValType.SCV_BOOL, value: false, expected: false },
        { switch: ScValType.SCV_VOID, value: undefined, expected: null },
        { switch: ScValType.SCV_STRING, value: 'hello', expected: 'hello' },
        { switch: ScValType.SCV_SYMBOL, value: 'symbol', expected: 'symbol' },
      ]

      supportedCases.forEach(({ switch: switchType, value, expected }) => {
        const scVal: ScVal = { switch: switchType, value }
        const result = normalizeScVal(scVal)
        expect(result).toBe(expected)
      })
    })
  })
})