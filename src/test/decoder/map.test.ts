import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import type { MapEntry } from '../../workers/decoder/normalizeScVal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ScVal map entry as the decoder expects it. */
function entry(key: unknown, val: unknown) {
  return { key, val }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('normalizeScVal - Map Handling', () => {
  describe('Empty maps', () => {
    it('normalizes an empty map to an empty array', () => {
      const result = normalizeScVal({ switch: ScValType.SCV_MAP, value: [] })
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    it('normalizes a map with undefined value to an empty array', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: undefined,
      })
      expect(result).toEqual([])
    })

    it('normalizes a map with null value to an empty array', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: null,
      })
      expect(result).toEqual([])
    })
  })

  describe('Output shape – always an entry array, never a plain object', () => {
    it('returns an array (not a plain object) for a non-empty map', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_STRING, value: 'k' },
            { switch: ScValType.SCV_U32, value: 1 },
          ),
        ],
      })
      expect(Array.isArray(result)).toBe(true)
      expect(typeof result === 'object' && Array.isArray(result)).toBe(true)
    })

    it('each element has exactly { key, value } shape', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'foo' },
            { switch: ScValType.SCV_BOOL, value: true },
          ),
        ],
      }) as Array<MapEntry>

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('key')
      expect(result[0]).toHaveProperty('value')
      // No extra properties
      expect(Object.keys(result[0]).sort()).toEqual(['key', 'value'])
    })
  })

  describe('Primitive keys', () => {
    it('handles symbol keys with primitive values', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'name' },
            { switch: ScValType.SCV_STRING, value: 'alice' },
          ),
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'age' },
            { switch: ScValType.SCV_U32, value: 30 },
          ),
        ],
      }) as Array<MapEntry>

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        key: { kind: 'primitive', primitive: 'symbol', value: 'name' },
        value: { kind: 'primitive', primitive: 'string', value: 'alice' },
      })
      expect(result[1]).toEqual({
        key: { kind: 'primitive', primitive: 'symbol', value: 'age' },
        value: { kind: 'primitive', primitive: 'u32', value: 30 },
      })
    })

    it('handles u32 keys', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_U32, value: 0 },
            { switch: ScValType.SCV_BOOL, value: false },
          ),
          entry(
            { switch: ScValType.SCV_U32, value: 1 },
            { switch: ScValType.SCV_BOOL, value: true },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0]).toEqual({
        key: { kind: 'primitive', primitive: 'u32', value: 0 },
        value: { kind: 'primitive', primitive: 'bool', value: false },
      })
      expect(result[1]).toEqual({
        key: { kind: 'primitive', primitive: 'u32', value: 1 },
        value: { kind: 'primitive', primitive: 'bool', value: true },
      })
    })

    it('handles i32 keys including negative values', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_I32, value: -1 },
            { switch: ScValType.SCV_STRING, value: 'minus-one' },
          ),
          entry(
            { switch: ScValType.SCV_I32, value: 2147483647 },
            { switch: ScValType.SCV_STRING, value: 'max-i32' },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0]).toEqual({
        key: { kind: 'primitive', primitive: 'i32', value: -1 },
        value: { kind: 'primitive', primitive: 'string', value: 'minus-one' },
      })
      expect(result[1]).toEqual({
        key: { kind: 'primitive', primitive: 'i32', value: 2147483647 },
        value: { kind: 'primitive', primitive: 'string', value: 'max-i32' },
      })
    })

    it('handles bool keys', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_BOOL, value: false },
            { switch: ScValType.SCV_U32, value: 0 },
          ),
          entry(
            { switch: ScValType.SCV_BOOL, value: true },
            { switch: ScValType.SCV_U32, value: 1 },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0]).toEqual({
        key: { kind: 'primitive', primitive: 'bool', value: false },
        value: { kind: 'primitive', primitive: 'u32', value: 0 },
      })
      expect(result[1]).toEqual({
        key: { kind: 'primitive', primitive: 'bool', value: true },
        value: { kind: 'primitive', primitive: 'u32', value: 1 },
      })
    })
  })

  describe('Non-primitive / complex keys', () => {
    it('preserves complex vec keys as normalized arrays', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            {
              switch: ScValType.SCV_VEC,
              value: [
                { switch: ScValType.SCV_U32, value: 1 },
                { switch: ScValType.SCV_U32, value: 2 },
              ],
            },
            { switch: ScValType.SCV_STRING, value: 'tuple-key' },
          ),
        ],
      }) as Array<MapEntry>

      expect(result).toHaveLength(1)
      expect(result[0].key).toEqual({
        kind: 'vec',
        items: [
          { kind: 'primitive', primitive: 'u32', value: 1 },
          { kind: 'primitive', primitive: 'u32', value: 2 },
        ],
      })
      expect(result[0].value).toEqual({ kind: 'primitive', primitive: 'string', value: 'tuple-key' })
    })

    it('preserves nested map as key', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            {
              switch: ScValType.SCV_MAP,
              value: [
                entry(
                  { switch: ScValType.SCV_SYMBOL, value: 'id' },
                  { switch: ScValType.SCV_U32, value: 42 },
                ),
              ],
            },
            { switch: ScValType.SCV_BOOL, value: true },
          ),
        ],
      }) as Array<MapEntry>

      expect(result).toHaveLength(1)
      expect(result[0].key).toEqual([
        {
          key: { kind: 'primitive', primitive: 'symbol', value: 'id' },
          value: { kind: 'primitive', primitive: 'u32', value: 42 },
        },
      ])
      expect(result[0].value).toEqual({ kind: 'primitive', primitive: 'bool', value: true })
    })
  })

  describe('Source map order is preserved', () => {
    it('preserves insertion order for primitive keys', () => {
      const keys = ['c', 'a', 'b', 'z', 'm']
      const mapValue = keys.map((k) =>
        entry(
          { switch: ScValType.SCV_SYMBOL, value: k },
          { switch: ScValType.SCV_VOID },
        ),
      )

      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: mapValue,
      }) as Array<MapEntry>

      const resultKeys = result.map((e: any) => (e.key).value)
      expect(resultKeys).toEqual(keys)
    })

    it('preserves order for mixed key types', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_U32, value: 10 },
            { switch: ScValType.SCV_STRING, value: 'first' },
          ),
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'second' },
            { switch: ScValType.SCV_U32, value: 2 },
          ),
          entry(
            { switch: ScValType.SCV_BOOL, value: true },
            { switch: ScValType.SCV_VOID },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0].key).toEqual({ kind: 'primitive', primitive: 'u32', value: 10 })
      expect(result[1].key).toEqual({ kind: 'primitive', primitive: 'symbol', value: 'second' })
      expect(result[2].key).toEqual({ kind: 'primitive', primitive: 'bool', value: true })
    })
  })

  describe('Nested maps', () => {
    it('recursively normalizes map values that are themselves maps', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'outer' },
            {
              switch: ScValType.SCV_MAP,
              value: [
                entry(
                  { switch: ScValType.SCV_SYMBOL, value: 'inner' },
                  { switch: ScValType.SCV_U32, value: 99 },
                ),
              ],
            },
          ),
        ],
      }) as Array<MapEntry>

      expect(result).toHaveLength(1)
      expect(result[0].key).toEqual({ kind: 'primitive', primitive: 'symbol', value: 'outer' })
      const inner = result[0].value as Array<MapEntry>
      expect(Array.isArray(inner)).toBe(true)
      expect(inner).toHaveLength(1)
      expect(inner[0]).toEqual({
        key: { kind: 'primitive', primitive: 'symbol', value: 'inner' },
        value: { kind: 'primitive', primitive: 'u32', value: 99 },
      })
    })

    it('recursively normalizes map values that contain vecs', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'list' },
            {
              switch: ScValType.SCV_VEC,
              value: [
                { switch: ScValType.SCV_U32, value: 1 },
                { switch: ScValType.SCV_U32, value: 2 },
                { switch: ScValType.SCV_U32, value: 3 },
              ],
            },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0].value).toEqual({
        kind: 'vec',
        items: [
          { kind: 'primitive', primitive: 'u32', value: 1 },
          { kind: 'primitive', primitive: 'u32', value: 2 },
          { kind: 'primitive', primitive: 'u32', value: 3 },
        ],
      })
    })

    it('handles maps nested three levels deep', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'l1' },
            {
              switch: ScValType.SCV_MAP,
              value: [
                entry(
                  { switch: ScValType.SCV_SYMBOL, value: 'l2' },
                  {
                    switch: ScValType.SCV_MAP,
                    value: [
                      entry(
                        { switch: ScValType.SCV_SYMBOL, value: 'l3' },
                        { switch: ScValType.SCV_U32, value: 7 },
                      ),
                    ],
                  },
                ),
              ],
            },
          ),
        ],
      }) as Array<MapEntry>

      const l2 = result[0].value as Array<MapEntry>
      const l3 = l2[0].value as Array<MapEntry>
      expect(l3[0]).toEqual({
        key: { kind: 'primitive', primitive: 'symbol', value: 'l3' },
        value: { kind: 'primitive', primitive: 'u32', value: 7 },
      })
    })
  })

  describe('Maps inside vecs', () => {
    it('normalizes maps that appear as elements inside a vec', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_MAP,
            value: [
              entry(
                { switch: ScValType.SCV_SYMBOL, value: 'x' },
                { switch: ScValType.SCV_U32, value: 1 },
              ),
            ],
          },
          {
            switch: ScValType.SCV_MAP,
            value: [
              entry(
                { switch: ScValType.SCV_SYMBOL, value: 'y' },
                { switch: ScValType.SCV_U32, value: 2 },
              ),
            ],
          },
        ],
      }) as Array<Array<MapEntry>>

      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items).toHaveLength(2)
      expect(r.items[0]).toEqual([
        {
          key: { kind: 'primitive', primitive: 'symbol', value: 'x' },
          value: { kind: 'primitive', primitive: 'u32', value: 1 },
        },
      ])
      expect(r.items[1]).toEqual([
        {
          key: { kind: 'primitive', primitive: 'symbol', value: 'y' },
          value: { kind: 'primitive', primitive: 'u32', value: 2 },
        },
      ])
    })
  })

  describe('Void values', () => {
    it('normalizes void map values to null', () => {
      const result = normalizeScVal({
        switch: ScValType.SCV_MAP,
        value: [
          entry(
            { switch: ScValType.SCV_SYMBOL, value: 'empty' },
            { switch: ScValType.SCV_VOID },
          ),
        ],
      }) as Array<MapEntry>

      expect(result[0]).toEqual({
        key: { kind: 'primitive', primitive: 'symbol', value: 'empty' },
        value: { kind: 'primitive', primitive: 'void', value: null },
      })
    })
  })
})
