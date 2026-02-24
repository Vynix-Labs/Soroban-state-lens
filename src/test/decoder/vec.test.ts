import { describe, expect, it } from 'vitest'
import { ScValType, normalizeScVal } from '../../workers/decoder/normalizeScVal'

describe('normalizeScVal - Vector Handling', () => {
  describe('Empty vectors', () => {
    it('should normalize empty vec to empty array', () => {
      const emptyVec = {
        switch: ScValType.SCV_VEC,
        value: [],
      }

      const result = normalizeScVal(emptyVec)
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should normalize undefined vec to empty array', () => {
      const undefinedVec = {
        switch: ScValType.SCV_VEC,
        value: undefined,
      }

      const result = normalizeScVal(undefinedVec)
      expect(result).toEqual([])
    })

    it('should normalize null vec to empty array', () => {
      const nullVec = {
        switch: ScValType.SCV_VEC,
        value: null,
      }

      const result = normalizeScVal(nullVec)
      expect(result).toEqual([])
    })
  })

  describe('Flat vectors', () => {
    it('should normalize flat vec of integers', () => {
      const flatVecInt = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 1 },
          { switch: ScValType.SCV_U32, value: 2 },
          { switch: ScValType.SCV_U32, value: 3 },
        ],
      }

      const result = normalizeScVal(flatVecInt)
      expect(result).toEqual([1, 2, 3])
      expect((result as Array<unknown>).length).toBe(3)
    })

    it('should preserve order in flat vectors', () => {
      const orderedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 5 },
          { switch: ScValType.SCV_U32, value: 1 },
          { switch: ScValType.SCV_U32, value: 9 },
        ],
      }

      const result = normalizeScVal(orderedVec)
      expect(result).toEqual([5, 1, 9])
    })

    it('should normalize flat vec of mixed scalar types', () => {
      const mixedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 42 },
          { switch: ScValType.SCV_BOOL, value: true },
          { switch: ScValType.SCV_STRING, value: 'hello' },
        ],
      }

      const result = normalizeScVal(mixedVec)
      expect((result as Array<unknown>).length).toBe(3)
      expect((result as Array<unknown>)[0]).toBe(42)
      expect((result as Array<unknown>)[1]).toBe(true)
      expect((result as Array<unknown>)[2]).toBe('hello')
    })

    it('should handle i32 values in vectors', () => {
      const i32Vec = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: -100 },
          { switch: ScValType.SCV_I32, value: 42 },
          { switch: ScValType.SCV_I32, value: 0 },
        ],
      }

      const result = normalizeScVal(i32Vec)
      expect(result).toEqual([-100, 42, 0])
    })
  })

  describe('Nested vectors', () => {
    it('should recursively normalize nested vec', () => {
      const nestedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_U32, value: 1 },
              { switch: ScValType.SCV_U32, value: 2 },
            ],
          },
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_U32, value: 3 },
              { switch: ScValType.SCV_U32, value: 4 },
            ],
          },
        ],
      }

      const result = normalizeScVal(nestedVec)
      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ])
    })

    it('should handle deeply nested vectors', () => {
      const deeplyNestedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              {
                switch: ScValType.SCV_VEC,
                value: [
                  { switch: ScValType.SCV_U32, value: 1 },
                  { switch: ScValType.SCV_U32, value: 2 },
                ],
              },
            ],
          },
        ],
      }

      const result = normalizeScVal(deeplyNestedVec)
      expect(result).toEqual([[[1, 2]]])
    })

    it('should preserve child types in nested structures', () => {
      const nestedMixedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_U32, value: 10 },
              { switch: ScValType.SCV_BOOL, value: false },
            ],
          },
          { switch: ScValType.SCV_U32, value: 20 },
        ],
      }

      const result = normalizeScVal(nestedMixedVec)
      expect(result).toEqual([[10, false], 20])
    })

    it('should preserve order in nested vectors', () => {
      const orderedNestedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_U32, value: 3 },
              { switch: ScValType.SCV_U32, value: 1 },
            ],
          },
          {
            switch: ScValType.SCV_VEC,
            value: [{ switch: ScValType.SCV_U32, value: 2 }],
          },
        ],
      }

      const result = normalizeScVal(orderedNestedVec)
      expect(result).toEqual([[3, 1], [2]])
    })

    it('should handle mixed nested and flat structure', () => {
      const mixedNestedVec = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 1 },
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_U32, value: 2 },
              { switch: ScValType.SCV_U32, value: 3 },
            ],
          },
          { switch: ScValType.SCV_U32, value: 4 },
        ],
      }

      const result = normalizeScVal(mixedNestedVec)
      expect(result).toEqual([1, [2, 3], 4])
    })

    it('should handle vectors with void values', () => {
      const vecWithVoid = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 1 },
          { switch: ScValType.SCV_VOID },
          { switch: ScValType.SCV_U32, value: 2 },
        ],
      }

      const result = normalizeScVal(vecWithVoid)
      expect(result).toEqual([1, null, 2])
    })

    it('should handle vectors with symbols', () => {
      const vecWithSymbols = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_SYMBOL, value: 'transfer' },
          { switch: ScValType.SCV_SYMBOL, value: 'approve' },
        ],
      }

      const result = normalizeScVal(vecWithSymbols)
      expect(result).toEqual(['transfer', 'approve'])
    })
  })

  describe('Order preservation', () => {
    it('should preserve exact order with complex element sequence', () => {
      const complexOrder = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_U32, value: 100 },
          { switch: ScValType.SCV_BOOL, value: false },
          { switch: ScValType.SCV_STRING, value: 'test' },
          { switch: ScValType.SCV_U32, value: 50 },
          { switch: ScValType.SCV_BOOL, value: true },
        ],
      }

      const result = normalizeScVal(complexOrder)
      expect(result).toEqual([100, false, 'test', 50, true])
      expect((result as Array<unknown>)[0]).toBe(100)
      expect((result as Array<unknown>)[1]).toBe(false)
      expect((result as Array<unknown>)[2]).toBe('test')
      expect((result as Array<unknown>)[3]).toBe(50)
      expect((result as Array<unknown>)[4]).toBe(true)
    })
  })
})
