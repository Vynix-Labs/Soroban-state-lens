import { describe, expect, it, vi } from 'vitest'
import { mapScvMapEntry } from '../../workers/decoder/mapScvMapEntry'

const identity = (item: unknown) => item

describe('mapScvMapEntry', () => {
  describe('happy path', () => {
    it('should return a tuple with stringified string key', () => {
      const result = mapScvMapEntry({ key: 'balance', val: 42 }, identity)
      expect(result).toEqual(['"balance"', 42])
    })

    it('should return a tuple with stringified number key', () => {
      const result = mapScvMapEntry({ key: 123, val: 'hello' }, identity)
      expect(result).toEqual(['123', 'hello'])
    })

    it('should return a tuple with stringified boolean key', () => {
      const result = mapScvMapEntry({ key: true, val: null }, identity)
      expect(result).toEqual(['true', null])
    })

    it('should return a tuple with stringified object key', () => {
      const result = mapScvMapEntry(
        { key: { type: 'account' }, val: 99 },
        identity,
      )
      expect(result).toEqual(['{"type":"account"}', 99])
    })

    it('should call normalize on the value', () => {
      const normalize = vi.fn((item: unknown) => String(item))
      const result = mapScvMapEntry({ key: 'k', val: 7 }, normalize)
      expect(normalize).toHaveBeenCalledWith(7)
      if (result) {
        expect(result[1]).toBe('7')
      }
    })

    it('should produce a tuple usable with Object.fromEntries', () => {
      const entries = [
        mapScvMapEntry({ key: 'a', val: 1 }, identity),
        mapScvMapEntry({ key: 'b', val: 2 }, identity),
      ]
      const validEntries = entries.filter(
        (entry): entry is [string, unknown] => entry !== undefined,
      )
      expect(Object.fromEntries(validEntries)).toEqual({ '"a"': 1, '"b"': 2 })
    })
  })

  describe('invalid input / edge cases', () => {
    it('should return undefined when key is undefined', () => {
      const result = mapScvMapEntry({ key: undefined, val: 'v' }, identity)
      expect(result).toBeUndefined()
    })

    it('should return undefined when key is a circular reference', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      const result = mapScvMapEntry({ key: circular, val: 'v' }, identity)
      expect(result).toBeUndefined()
    })

    it('should return undefined when key is a function', () => {
      const result = mapScvMapEntry({ key: () => {}, val: 0 }, identity)
      expect(result).toBeUndefined()
    })

    it('should not normalize value when key is invalid', () => {
      const normalize = vi.fn((item: unknown) => `normalized:${item}`)
      const result = mapScvMapEntry({ key: undefined, val: 'data' }, normalize)
      expect(result).toBeUndefined()
      expect(normalize).not.toHaveBeenCalled()
    })

    it('should handle null key as stringified "null"', () => {
      const result = mapScvMapEntry({ key: null, val: 1 }, identity)
      expect(result).toBeDefined()
      if (result) {
        expect(result[0]).toBe('null')
      }
    })

    it('should handle array key by stringifying it', () => {
      const result = mapScvMapEntry({ key: [1, 2], val: 'x' }, identity)
      expect(result).toBeDefined()
      if (result) {
        expect(result[0]).toBe('[1,2]')
      }
    })

    describe('collision prevention', () => {
      it('should prevent multiple invalid keys from colliding', () => {
        const entries = [
          mapScvMapEntry({ key: undefined, val: 'value1' }, identity),
          mapScvMapEntry({ key: () => {}, val: 'value2' }, identity),
          mapScvMapEntry({ key: Symbol('test'), val: 'value3' }, identity),
        ]

        // All invalid keys should return undefined, preventing collisions
        expect(entries[0]).toBeUndefined()
        expect(entries[1]).toBeUndefined()
        expect(entries[2]).toBeUndefined()

        // When filtering out undefined, no entries remain
        const validEntries = entries.filter(
          (entry): entry is [string, unknown] => entry !== undefined,
        )
        expect(validEntries).toHaveLength(0)
      })

      it('should prevent circular reference key collisions', () => {
        const circular1: Record<string, unknown> = {}
        circular1.self = circular1

        const circular2: Record<string, unknown> = {}
        circular2.self = circular2

        const entries = [
          mapScvMapEntry({ key: circular1, val: 'first' }, identity),
          mapScvMapEntry({ key: circular2, val: 'second' }, identity),
        ]

        // Both circular keys should return undefined
        expect(entries[0]).toBeUndefined()
        expect(entries[1]).toBeUndefined()

        // No collision occurs since both are skipped
        const validEntries = entries.filter(
          (entry): entry is [string, unknown] => entry !== undefined,
        )
        expect(validEntries).toHaveLength(0)
      })

      it('should preserve valid keys alongside invalid ones', () => {
        const entries = [
          mapScvMapEntry({ key: 'valid1', val: 'value1' }, identity),
          mapScvMapEntry({ key: undefined, val: 'value2' }, identity),
          mapScvMapEntry({ key: 'valid2', val: 'value3' }, identity),
          mapScvMapEntry({ key: () => {}, val: 'value4' }, identity),
        ]

        const validEntries = entries.filter(
          (entry): entry is [string, unknown] => entry !== undefined,
        )

        // Only valid keys should remain
        expect(validEntries).toHaveLength(2)
        expect(validEntries[0]).toEqual(['"valid1"', 'value1'])
        expect(validEntries[1]).toEqual(['"valid2"', 'value3'])
      })
    })
  })
})
