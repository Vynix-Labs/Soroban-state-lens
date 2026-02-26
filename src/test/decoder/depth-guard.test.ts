import { describe, expect, it } from 'vitest'
import {
  ScValType,
  normalizeScVal,
} from '../../workers/decoder/normalizeScVal'
import type { NormalizedValue, TruncatedMarker } from '../../types/normalized'

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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 3 })
      expect(result).toEqual([1, [2, 3]])
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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 1 }) as unknown as Array<NormalizedValue>
      expect(result.length).toBe(2)
      expect(isTruncatedMarker(result[0])).toBe(true)
      expect(isTruncatedMarker(result[1])).toBe(true)
      expect((result[0] as TruncatedMarker).depth).toBe(1)
      expect((result[1] as TruncatedMarker).depth).toBe(1)
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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 2 }) as unknown as Array<NormalizedValue>
      expect(result[0]).toBe(1)
      expect(Array.isArray(result[1])).toBe(true)
      const inner = result[1] as unknown as Array<NormalizedValue>
      expect(inner.length).toBe(1)
      expect(isTruncatedMarker(inner[0])).toBe(true)
      expect((inner[0] as TruncatedMarker).depth).toBe(2)
    })

    it('root is replaced with truncated when maxDepth is 0', () => {
      const scVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
        ],
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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 1 }) as unknown as Array<NormalizedValue>
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(isTruncatedMarker(result[0])).toBe(true)
      expect((result[0] as TruncatedMarker).depth).toBe(1)
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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 2 }) as unknown as Array<NormalizedValue>
      const level1 = result[0] as unknown as Array<NormalizedValue>
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
      const result = normalizeScVal(scVal)
      expect(result).toEqual([[42]])
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
      const result = normalizeScVal(scVal, undefined, {})
      expect(result).toEqual([[42]])
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
      const result = normalizeScVal(scVal, undefined, { maxDepth: 1 }) as unknown as Array<NormalizedValue>
      const marker = result[0] as TruncatedMarker
      const json = JSON.stringify(marker)
      const parsed = JSON.parse(json)
      expect(parsed.__truncated).toBe(true)
      expect(parsed.depth).toBe(1)
    })
  })
})
