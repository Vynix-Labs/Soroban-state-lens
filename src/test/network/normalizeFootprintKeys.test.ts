import { describe, expect, it } from 'vitest'
import { normalizeFootprintKeys } from '../../lib/network/normalizeFootprintKeys'
import type { SimulateTransactionResult } from '../../lib/network/simulateTransaction'

function success(
  footprint: { readOnly?: Array<string>; readWrite?: Array<string> },
): SimulateTransactionResult {
  return {
    success: true,
    footprint: {
      readOnly: footprint.readOnly ?? [],
      readWrite: footprint.readWrite ?? [],
    },
  }
}

describe('normalizeFootprintKeys', () => {
  it('returns empty shape when result is null', () => {
    expect(normalizeFootprintKeys(null)).toEqual({
      readOnly: [],
      readWrite: [],
      keys: [],
    })
  })

  it('returns empty shape when result is undefined', () => {
    expect(normalizeFootprintKeys(undefined)).toEqual({
      readOnly: [],
      readWrite: [],
      keys: [],
    })
  })

  it('returns empty shape for an unsuccessful result', () => {
    const result = normalizeFootprintKeys({
      success: false,
      error: 'simulation failed',
    })
    expect(result).toEqual({ readOnly: [], readWrite: [], keys: [] })
  })

  it('returns empty shape when the footprint is missing', () => {
    const result = normalizeFootprintKeys({ success: true })
    expect(result).toEqual({ readOnly: [], readWrite: [], keys: [] })
  })

  describe('read-only payloads', () => {
    it('extracts and orders read-only keys', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: ['zzz', 'aaa', 'mmm'] }),
      )
      expect(result.readOnly).toEqual(['aaa', 'mmm', 'zzz'])
      expect(result.readWrite).toEqual([])
      expect(result.keys).toEqual([
        { id: 'aaa', access: 'read' },
        { id: 'mmm', access: 'read' },
        { id: 'zzz', access: 'read' },
      ])
    })

    it('deduplicates repeated read-only keys', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: ['key1', 'key2', 'key1', 'key2', 'key1'] }),
      )
      expect(result.readOnly).toEqual(['key1', 'key2'])
      expect(result.keys).toEqual([
        { id: 'key1', access: 'read' },
        { id: 'key2', access: 'read' },
      ])
    })
  })

  describe('write-only payloads', () => {
    it('extracts and orders read-write keys', () => {
      const result = normalizeFootprintKeys(
        success({ readWrite: ['ccc', 'aaa', 'bbb'] }),
      )
      expect(result.readOnly).toEqual([])
      expect(result.readWrite).toEqual(['aaa', 'bbb', 'ccc'])
      expect(result.keys).toEqual([
        { id: 'aaa', access: 'write' },
        { id: 'bbb', access: 'write' },
        { id: 'ccc', access: 'write' },
      ])
    })

    it('deduplicates repeated read-write keys', () => {
      const result = normalizeFootprintKeys(
        success({ readWrite: ['keyA', 'keyB', 'keyA'] }),
      )
      expect(result.readWrite).toEqual(['keyA', 'keyB'])
    })
  })

  describe('mixed payloads', () => {
    it('lists read keys before write keys, each ordered', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: ['r2', 'r1'], readWrite: ['w2', 'w1'] }),
      )
      expect(result.readOnly).toEqual(['r1', 'r2'])
      expect(result.readWrite).toEqual(['w1', 'w2'])
      expect(result.keys).toEqual([
        { id: 'r1', access: 'read' },
        { id: 'r2', access: 'read' },
        { id: 'w1', access: 'write' },
        { id: 'w2', access: 'write' },
      ])
    })

    it('reports a key in both sections once as write in the flat list', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: ['shared', 'readish'], readWrite: ['shared'] }),
      )
      // Sections retain their own membership.
      expect(result.readOnly).toEqual(['readish', 'shared'])
      expect(result.readWrite).toEqual(['shared'])
      // The unified list dedupes across sections, preferring write access.
      expect(result.keys).toEqual([
        { id: 'readish', access: 'read' },
        { id: 'shared', access: 'write' },
      ])
    })
  })

  describe('normalization', () => {
    it('trims whitespace before deduping', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: [' key1', 'key1 ', 'key1'] }),
      )
      expect(result.readOnly).toEqual(['key1'])
    })

    it('drops blank and whitespace-only keys', () => {
      const result = normalizeFootprintKeys(
        success({ readOnly: ['', '   ', 'key1'], readWrite: [''] }),
      )
      expect(result.readOnly).toEqual(['key1'])
      expect(result.readWrite).toEqual([])
    })
  })
})
