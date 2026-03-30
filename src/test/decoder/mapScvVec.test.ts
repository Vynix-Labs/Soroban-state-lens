import { describe, expect, it, vi } from 'vitest'
import { mapScvVec } from '../../workers/decoder/mapScvVec'

describe('mapScvVec', () => {
  describe('happy path', () => {
    it('maps each item through the normalize callback in order', () => {
      const result = mapScvVec([1, 2, 3], (x) => (x as number) * 2)
      expect(result).toEqual([2, 4, 6])
    })

    it('returns an empty array for an empty input array', () => {
      expect(mapScvVec([], (x) => x)).toEqual([])
    })

    it('preserves insertion order', () => {
      const order: Array<number> = []
      mapScvVec([10, 20, 30], (x) => {
        order.push(x as number)
        return x
      })
      expect(order).toEqual([10, 20, 30])
    })

    it('passes each item as-is to the callback', () => {
      const spy = vi.fn((x: unknown) => x)
      mapScvVec(['a', 'b'], spy)
      expect(spy).toHaveBeenNthCalledWith(1, 'a')
      expect(spy).toHaveBeenNthCalledWith(2, 'b')
    })

    it('works with heterogeneous items', () => {
      const result = mapScvVec([1, 'two', null, true], String)
      expect(result).toEqual(['1', 'two', 'null', 'true'])
    })

    it('works with object items', () => {
      const items = [{ v: 1 }, { v: 2 }]
      const result = mapScvVec(items, (x) => (x as { v: number }).v)
      expect(result).toEqual([1, 2])
    })
  })

  describe('invalid input – non-array treated as empty array', () => {
    it('returns [] for null', () => {
      expect(mapScvVec(null as unknown as Array<unknown>, (x) => x)).toEqual([])
    })

    it('returns [] for undefined', () => {
      expect(
        mapScvVec(undefined as unknown as Array<unknown>, (x) => x),
      ).toEqual([])
    })

    it('returns [] for a number', () => {
      expect(mapScvVec(42 as unknown as Array<unknown>, (x) => x)).toEqual([])
    })

    it('returns [] for a string', () => {
      expect(mapScvVec('hello' as unknown as Array<unknown>, (x) => x)).toEqual(
        [],
      )
    })

    it('returns [] for a plain object', () => {
      expect(mapScvVec({} as unknown as Array<unknown>, (x) => x)).toEqual([])
    })

    it('returns [] for a boolean', () => {
      expect(mapScvVec(true as unknown as Array<unknown>, (x) => x)).toEqual([])
    })
  })

  describe('edge cases – callback error guard', () => {
    it('returns null for an item whose callback throws', () => {
      const result = mapScvVec([1, 2, 3], (x) => {
        if (x === 2) throw new Error('boom')
        return x
      })
      expect(result).toEqual([1, null, 3])
    })

    it('returns null for every item when callback always throws', () => {
      const result = mapScvVec([1, 2, 3], () => {
        throw new Error('always fails')
      })
      expect(result).toEqual([null, null, null])
    })

    it('continues processing remaining items after a callback error', () => {
      const result = mapScvVec(['a', 'b', 'c'], (x) => {
        if (x === 'b') throw new Error('skip')
        return (x as string).toUpperCase()
      })
      expect(result).toEqual(['A', null, 'C'])
    })

    it('handles a callback that throws a non-Error value', () => {
      const result = mapScvVec([1], () => {
        throw 'string error'
      })
      expect(result).toEqual([null])
    })
  })
})
