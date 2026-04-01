import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'
import { normalizeNode } from '../../workers/decoder/normalizeNode'
import type { TruncatedMarker } from '../../types/normalized'
import type { TruncatedNode } from '../../types/node'

function isTruncatedMarker(value: unknown): value is TruncatedMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__truncated' in value &&
    (value as TruncatedMarker).__truncated
  )
}

describe('Depth Guard - maxDepth', () => {
  describe('below limit', () => {
    it('normalizes fully when depth is below maxDepth', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_I32, value: 2 },
              { switch: ScValType.SCV_I32, value: 3 },
            ],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 3 })
      expect(result.kind).toBe('vec')
      expect(result.items[0].value).toBe(1)
      expect(result.items[1].kind).toBe('vec')
      expect(result.items[1].items.map((i: any) => i.value)).toEqual([2, 3])
    })

    it('truncates vec children when maxDepth is 1', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_I32, value: 2 }],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 1 })
      expect(result.kind).toBe('vec')
      expect(result.items.length).toBe(2)
      expect(isTruncatedMarker(result.items[0])).toBe(true)
      expect(isTruncatedMarker(result.items[1])).toBe(true)
      expect((result.items[0] as TruncatedMarker).depth).toBe(1)
      expect((result.items[1] as TruncatedMarker).depth).toBe(1)
    })
  })

  describe('at limit', () => {
    it('returns truncated marker at maxDepth for vec children', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_I32, value: 2 }],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 2 })
      expect(result.kind).toBe('vec')
      expect(result.items[0].value).toBe(1)
      expect(result.items[1].kind).toBe('vec')
      const inner = result.items[1].items as Array<unknown>
      expect(inner.length).toBe(1)
      expect(isTruncatedMarker(inner[0])).toBe(true)
      expect((inner[0] as TruncatedMarker).depth).toBe(2)
    })

    it('root is replaced with truncated when maxDepth is 0', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [{ switch: ScValType.SCV_I32, value: 1 }],
      }
      const result = normalizeScVal(scVal, undefined, { maxDepth: 0 })
      expect(isTruncatedMarker(result)).toBe(true)
      expect((result as TruncatedMarker).depth).toBe(0)
    })
  })

  describe('above limit', () => {
    it('returns truncated marker when depth exceeds maxDepth', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              {
                switch: ScValType.SCV_VEC,
                value: [{ switch: ScValType.SCV_I32, value: 99 }],
              },
            ],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 1 })
      expect(result.kind).toBe('vec')
      expect(result.items.length).toBe(1)
      expect(isTruncatedMarker(result.items[0])).toBe(true)
      expect((result.items[0] as TruncatedMarker).depth).toBe(1)
    })

    it('deep nesting produces truncated at each level past maxDepth', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              {
                switch: ScValType.SCV_VEC,
                value: [
                  {
                    switch: ScValType.SCV_VEC,
                    value: [{ switch: ScValType.SCV_I32, value: 1 }],
                  },
                ],
              },
            ],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 2 })
      const level1 = result.items[0].items as Array<unknown>
      expect(level1.length).toBe(1)
      expect(isTruncatedMarker(level1[0])).toBe(true)
      expect((level1[0] as TruncatedMarker).depth).toBe(2)
    })
  })

  describe('without maxDepth', () => {
    it('behaves as before when options omitted', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_I32, value: 42 }],
          },
        ],
      }
      const result: any = normalizeScVal(scVal)
      expect(result.kind).toBe('vec')
      expect(result.items[0].kind).toBe('vec')
      expect(result.items[0].items[0].value).toBe(42)
    })

    it('behaves as before when options.maxDepth omitted', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_I32, value: 42 }],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, {})
      expect(result.kind).toBe('vec')
      expect(result.items[0].kind).toBe('vec')
      expect(result.items[0].items[0].value).toBe(42)
    })
  })

  describe('truncated marker shape', () => {
    it('truncated marker is JSON-serializable', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_I32, value: 1 }],
          },
        ],
      }
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 1 })
      const marker = result.items[0] as TruncatedMarker
      const json = JSON.stringify(marker)
      const parsed = JSON.parse(json)
      expect(parsed.__truncated).toBe(true)
      expect(parsed.depth).toBe(1)
    })
  })

  describe('SCV_MAP recursion', () => {
    it('truncates map entries when limit is reached', () => {
      const scVal = {
        switch: ScValType.SCV_MAP,
        value: [
          {
            key: { switch: ScValType.SCV_SYMBOL, value: 'k1' },
            val: {
              switch: ScValType.SCV_VEC,
              value: [{ switch: ScValType.SCV_I32, value: 1 }],
            },
          },
        ],
      }
      // Inner vec is at depth 1, its children at depth 2
      const result: any = normalizeScVal(scVal, undefined, { maxDepth: 2 })
      expect(result[0].key.value).toBe('k1')
      expect(result[0].value.kind).toBe('vec')
      expect(isTruncatedMarker(result[0].value.items[0])).toBe(true)
      expect(result[0].value.items[0].depth).toBe(2)
    })
  })

  describe('Sensible Defaults', () => {
    it('uses default maxDepth when not provided in normalizeScVal', () => {
      // Create a very deep structure (> 32)
      let deep: any = { switch: ScValType.SCV_I32, value: 0 }
      for (let i = 0; i < 40; i++) {
        deep = { switch: ScValType.SCV_VEC, value: [deep] }
      }

      const result: any = normalizeScVal(deep)
      // Should be truncated at depth 32
      let current = result
      let d = 0
      while (current && current.kind === 'vec') {
        current = current.items[0]
        d++
      }
      expect(isTruncatedMarker(current)).toBe(true)
      expect(current.depth).toBe(32)
      expect(d).toBe(32)
    })
  })
})


function isTruncatedNode(node: any): node is TruncatedNode {
  return node && node.kind === 'truncated'
}

describe('normalizeNode - maxDepth', () => {
  it('respects default maxDepth in normalizeNode', () => {
    let deep: any = { switch: ScValType.SCV_I32, value: 0 }
    for (let i = 0; i < 40; i++) {
      deep = { switch: ScValType.SCV_VEC, value: [deep] }
    }

    const result: any = normalizeNode(deep)
    let current = result
    let d = 0
    while (current && current.kind === 'vec') {
      current = current.items[0]
      d++
    }
    expect(isTruncatedNode(current)).toBe(true)
    expect((current as TruncatedNode).depth).toBe(32)
    expect(d).toBe(32)
  })

  it('respects provided maxDepth in normalizeNode', () => {
    const scVal = {
      switch: ScValType.SCV_VEC,
      value: [{ switch: ScValType.SCV_I32, value: 1 }],
    }
    const result = normalizeNode(scVal, [], undefined, { maxDepth: 0 })
    expect(isTruncatedNode(result)).toBe(true)
    expect((result as TruncatedNode).depth).toBe(0)
  })
})
