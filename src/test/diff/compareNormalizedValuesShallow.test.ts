import { describe, expect, it } from 'vitest'
import { compareNormalizedValuesShallow } from '../../lib/diff/compareNormalizedValuesShallow'

describe('compareNormalizedValuesShallow', () => {
  // Happy path - matching values
  describe('primitives', () => {
    it('should return true for identical strings', () => {
      expect(compareNormalizedValuesShallow('hello', 'hello')).toBe(true)
    })

    it('should return true for identical numbers', () => {
      expect(compareNormalizedValuesShallow(42, 42)).toBe(true)
      expect(compareNormalizedValuesShallow(0, 0)).toBe(true)
      expect(compareNormalizedValuesShallow(-1, -1)).toBe(true)
    })

    it('should return true for identical booleans', () => {
      expect(compareNormalizedValuesShallow(true, true)).toBe(true)
      expect(compareNormalizedValuesShallow(false, false)).toBe(true)
    })

    it('should return false for different strings', () => {
      expect(compareNormalizedValuesShallow('hello', 'world')).toBe(false)
    })

    it('should return false for different numbers', () => {
      expect(compareNormalizedValuesShallow(42, 43)).toBe(false)
    })

    it('should return false for different booleans', () => {
      expect(compareNormalizedValuesShallow(true, false)).toBe(false)
    })
  })

  describe('null and undefined', () => {
    it('should return true for identical null values', () => {
      expect(compareNormalizedValuesShallow(null, null)).toBe(true)
    })

    it('should return true for identical undefined values', () => {
      expect(compareNormalizedValuesShallow(undefined, undefined)).toBe(true)
    })

    it('should return false for null vs undefined', () => {
      expect(compareNormalizedValuesShallow(null, undefined)).toBe(false)
    })

    it('should return false for null vs primitive', () => {
      expect(compareNormalizedValuesShallow(null, 'value')).toBe(false)
    })

    it('should return false for undefined vs primitive', () => {
      expect(compareNormalizedValuesShallow(undefined, 0)).toBe(false)
    })
  })

  describe('arrays', () => {
    it('should return true for identical empty arrays', () => {
      expect(compareNormalizedValuesShallow([], [])).toBe(true)
    })

    it('should return true for identical arrays with primitives', () => {
      expect(compareNormalizedValuesShallow([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(compareNormalizedValuesShallow(['a', 'b'], ['a', 'b'])).toBe(true)
    })

    it('should return true for identical arrays with mixed primitives', () => {
      expect(compareNormalizedValuesShallow([1, 'a', true], [1, 'a', true])).toBe(true)
    })

    it('should return false for different length arrays', () => {
      expect(compareNormalizedValuesShallow([1, 2], [1, 2, 3])).toBe(false)
      expect(compareNormalizedValuesShallow([1, 2, 3], [1, 2])).toBe(false)
    })

    it('should return false for arrays with different elements', () => {
      expect(compareNormalizedValuesShallow([1, 2, 3], [1, 2, 4])).toBe(false)
    })

    it('should return false for different array order', () => {
      expect(compareNormalizedValuesShallow([1, 2, 3], [3, 2, 1])).toBe(false)
    })

    it('should compare array elements by identity/value', () => {
      const obj = { a: 1 }
      expect(compareNormalizedValuesShallow([obj], [obj])).toBe(true)
      expect(compareNormalizedValuesShallow([{ a: 1 }], [{ a: 1 }])).toBe(false)
    })
  })

  describe('plain objects', () => {
    it('should return true for identical empty objects', () => {
      expect(compareNormalizedValuesShallow({}, {})).toBe(true)
    })

    it('should return true for identical objects with primitives', () => {
      expect(compareNormalizedValuesShallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })

    it('should return true for identical objects with strings', () => {
      expect(compareNormalizedValuesShallow({ key: 'value' }, { key: 'value' })).toBe(true)
    })

    it('should return true for objects with different key order', () => {
      expect(compareNormalizedValuesShallow({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    })

    it('should return false for objects with different values', () => {
      expect(compareNormalizedValuesShallow({ a: 1 }, { a: 2 })).toBe(false)
    })

    it('should return false for objects with extra keys', () => {
      expect(compareNormalizedValuesShallow({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    it('should return false for objects with missing keys', () => {
      expect(compareNormalizedValuesShallow({ a: 1, b: 2 }, { a: 1 })).toBe(false)
    })

    it('should return false for objects with different keys', () => {
      expect(compareNormalizedValuesShallow({ a: 1 }, { b: 1 })).toBe(false)
    })
  })

  describe('edge cases - nested mismatches', () => {
    it('should return false for nested arrays (shallow only)', () => {
      expect(compareNormalizedValuesShallow([[1, 2]], [[1, 2]])).toBe(false)
    })

    it('should return false for nested objects (shallow only)', () => {
      expect(compareNormalizedValuesShallow({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false)
    })

    it('should return false for array vs object with same content', () => {
      expect(compareNormalizedValuesShallow([1, 2], { 0: 1, 1: 2, length: 2 })).toBe(false)
    })
  })

  describe('invalid inputs / type mismatches', () => {
    it('should return false for number vs string', () => {
      expect(compareNormalizedValuesShallow(42, '42')).toBe(false)
    })

    it('should return false for boolean vs number', () => {
      expect(compareNormalizedValuesShallow(true, 1)).toBe(false)
    })

    it('should return false for string vs array', () => {
      expect(compareNormalizedValuesShallow('a', ['a'])).toBe(false)
    })

    it('should return false for object vs primitive', () => {
      expect(compareNormalizedValuesShallow({ a: 1 }, 1)).toBe(false)
    })
  })

  describe('special values', () => {
    it('should handle NaN correctly', () => {
      expect(compareNormalizedValuesShallow(NaN, NaN)).toBe(true)
    })

    it('should handle Infinity correctly', () => {
      expect(compareNormalizedValuesShallow(Infinity, Infinity)).toBe(true)
      expect(compareNormalizedValuesShallow(-Infinity, -Infinity)).toBe(true)
    })

    it('should return false for positive vs negative Infinity', () => {
      expect(compareNormalizedValuesShallow(Infinity, -Infinity)).toBe(false)
    })
  })
})
