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
      expect(result[1]).toBe('7')
    })

    it('should produce a tuple usable with Object.fromEntries', () => {
      const entries = [
        mapScvMapEntry({ key: 'a', val: 1 }, identity),
        mapScvMapEntry({ key: 'b', val: 2 }, identity),
      ]
      expect(Object.fromEntries(entries)).toEqual({ '"a"': 1, '"b"': 2 })
    })
  })

  describe('invalid input / edge cases', () => {
    it('should use __invalid_key when key is undefined', () => {
      const result = mapScvMapEntry({ key: undefined, val: 'v' }, identity)
      expect(result[0]).toBe('__invalid_key')
    })

    it('should use __invalid_key when key is a circular reference', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      const result = mapScvMapEntry({ key: circular, val: 'v' }, identity)
      expect(result[0]).toBe('__invalid_key')
    })

    it('should use __invalid_key when key is a function', () => {
      const result = mapScvMapEntry({ key: () => {}, val: 0 }, identity)
      expect(result[0]).toBe('__invalid_key')
    })

    it('should still normalize the value even when key is invalid', () => {
      const normalize = vi.fn((item: unknown) => `normalized:${item}`)
      const result = mapScvMapEntry({ key: undefined, val: 'data' }, normalize)
      expect(result[0]).toBe('__invalid_key')
      expect(result[1]).toBe('normalized:data')
    })

    it('should handle null key as stringified "null"', () => {
      const result = mapScvMapEntry({ key: null, val: 1 }, identity)
      expect(result[0]).toBe('null')
    })

    it('should handle array key by stringifying it', () => {
      const result = mapScvMapEntry({ key: [1, 2], val: 'x' }, identity)
      expect(result[0]).toBe('[1,2]')
    })
  })
})
