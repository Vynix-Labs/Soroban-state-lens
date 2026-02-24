import { describe, expect, it } from 'vitest'
import { resolveDiffStatus } from '../../lib/diff/resolveDiffStatus'

describe('resolveDiffStatus', () => {
  describe('happy path', () => {
    it('returns "unchanged" when both values are identical primitives', () => {
      expect(resolveDiffStatus(42, 42)).toBe('unchanged')
      expect(resolveDiffStatus('hello', 'hello')).toBe('unchanged')
      expect(resolveDiffStatus(true, true)).toBe('unchanged')
      expect(resolveDiffStatus(false, false)).toBe('unchanged')
    })

    it('returns "changed" when primitive values differ', () => {
      expect(resolveDiffStatus(42, 43)).toBe('changed')
      expect(resolveDiffStatus('hello', 'world')).toBe('changed')
      expect(resolveDiffStatus(true, false)).toBe('changed')
    })

    it('returns "unchanged" when both values are the same reference', () => {
      const obj = { a: 1 }
      const arr = [1, 2, 3]
      expect(resolveDiffStatus(obj, obj)).toBe('unchanged')
      expect(resolveDiffStatus(arr, arr)).toBe('unchanged')
    })

    it('returns "changed" when object references differ', () => {
      expect(resolveDiffStatus({ a: 1 }, { a: 1 })).toBe('changed')
      expect(resolveDiffStatus([1, 2], [1, 2])).toBe('changed')
    })
  })

  describe('null/undefined handling', () => {
    it('returns "added" when prev is null and next is not', () => {
      expect(resolveDiffStatus(null, 42)).toBe('added')
      expect(resolveDiffStatus(null, 'hello')).toBe('added')
      expect(resolveDiffStatus(null, {})).toBe('added')
    })

    it('returns "added" when prev is undefined and next is not', () => {
      expect(resolveDiffStatus(undefined, 42)).toBe('added')
      expect(resolveDiffStatus(undefined, 'hello')).toBe('added')
      expect(resolveDiffStatus(undefined, {})).toBe('added')
    })

    it('returns "removed" when prev is not nullish and next is null', () => {
      expect(resolveDiffStatus(42, null)).toBe('removed')
      expect(resolveDiffStatus('hello', null)).toBe('removed')
      expect(resolveDiffStatus({}, null)).toBe('removed')
    })

    it('returns "removed" when prev is not nullish and next is undefined', () => {
      expect(resolveDiffStatus(42, undefined)).toBe('removed')
      expect(resolveDiffStatus('hello', undefined)).toBe('removed')
      expect(resolveDiffStatus({}, undefined)).toBe('removed')
    })

    it('returns "unchanged" when both are null', () => {
      expect(resolveDiffStatus(null, null)).toBe('unchanged')
    })

    it('returns "unchanged" when both are undefined', () => {
      expect(resolveDiffStatus(undefined, undefined)).toBe('unchanged')
    })

    it('returns "unchanged" when prev is null and next is undefined', () => {
      expect(resolveDiffStatus(null, undefined)).toBe('unchanged')
    })

    it('returns "unchanged" when prev is undefined and next is null', () => {
      expect(resolveDiffStatus(undefined, null)).toBe('unchanged')
    })
  })

  describe('NaN transitions', () => {
    it('returns "unchanged" when both values are NaN', () => {
      expect(resolveDiffStatus(NaN, NaN)).toBe('unchanged')
    })

    it('returns "changed" when prev is NaN and next is a number', () => {
      expect(resolveDiffStatus(NaN, 42)).toBe('changed')
      expect(resolveDiffStatus(NaN, 0)).toBe('changed')
    })

    it('returns "changed" when prev is a number and next is NaN', () => {
      expect(resolveDiffStatus(42, NaN)).toBe('changed')
      expect(resolveDiffStatus(0, NaN)).toBe('changed')
    })

    it('returns "changed" when prev is NaN and next is non-number', () => {
      expect(resolveDiffStatus(NaN, 'hello')).toBe('changed')
      expect(resolveDiffStatus(NaN, {})).toBe('changed')
    })
  })

  describe('type flips', () => {
    it('returns "changed" when types differ', () => {
      expect(resolveDiffStatus(42, '42')).toBe('changed')
      expect(resolveDiffStatus('hello', 123)).toBe('changed')
      expect(resolveDiffStatus(true, 1)).toBe('changed')
      expect(resolveDiffStatus(false, 0)).toBe('changed')
      expect(resolveDiffStatus({}, [])).toBe('changed')
      expect(resolveDiffStatus('string', {})).toBe('changed')
    })

    it('returns "changed" when number becomes string', () => {
      expect(resolveDiffStatus(0, '0')).toBe('changed')
      expect(resolveDiffStatus(1, '1')).toBe('changed')
    })

    it('returns "changed" when boolean becomes number', () => {
      expect(resolveDiffStatus(true, 1)).toBe('changed')
      expect(resolveDiffStatus(false, 0)).toBe('changed')
    })
  })

  describe('edge cases', () => {
    it('handles zero values correctly', () => {
      expect(resolveDiffStatus(0, 0)).toBe('unchanged')
      expect(resolveDiffStatus(0, 1)).toBe('changed')
      expect(resolveDiffStatus(-0, 0)).toBe('unchanged')
    })

    it('handles empty strings', () => {
      expect(resolveDiffStatus('', '')).toBe('unchanged')
      expect(resolveDiffStatus('', 'hello')).toBe('changed')
    })

    it('handles boolean values', () => {
      expect(resolveDiffStatus(true, true)).toBe('unchanged')
      expect(resolveDiffStatus(false, false)).toBe('unchanged')
      expect(resolveDiffStatus(true, false)).toBe('changed')
    })

    it('handles bigint values', () => {
      expect(resolveDiffStatus(BigInt(42), BigInt(42))).toBe('unchanged')
      expect(resolveDiffStatus(BigInt(42), BigInt(43))).toBe('changed')
    })

    it('handles symbol values', () => {
      const sym1 = Symbol('test')
      const sym2 = Symbol('test')
      expect(resolveDiffStatus(sym1, sym1)).toBe('unchanged')
      expect(resolveDiffStatus(sym1, sym2)).toBe('changed')
    })
  })

  describe('invalid input', () => {
    it('handles function values', () => {
      const fn1 = () => {}
      const fn2 = () => {}
      expect(resolveDiffStatus(fn1, fn1)).toBe('unchanged')
      expect(resolveDiffStatus(fn1, fn2)).toBe('changed')
    })

    it('handles mixed nullish and non-nullish values', () => {
      expect(resolveDiffStatus(null, 0)).toBe('added')
      expect(resolveDiffStatus(0, null)).toBe('removed')
      expect(resolveDiffStatus(undefined, false)).toBe('added')
      expect(resolveDiffStatus(false, undefined)).toBe('removed')
    })
  })
})
