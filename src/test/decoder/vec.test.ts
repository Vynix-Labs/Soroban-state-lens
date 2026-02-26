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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items).toEqual([])
      expect(Array.isArray(r.items)).toBe(true)
    })

    it('should normalize undefined vec to empty array', () => {
      const undefinedVec = {
        switch: ScValType.SCV_VEC,
        value: undefined,
      }

      const result = normalizeScVal(undefinedVec)
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items).toEqual([])
    })

    it('should normalize null vec to empty array', () => {
      const nullVec = {
        switch: ScValType.SCV_VEC,
        value: null,
      }

      const result = normalizeScVal(nullVec)
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items).toEqual([])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.length).toBe(3)
      expect(r.items.map((i: any) => i.value)).toEqual([1, 2, 3])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.map((i: any) => i.value)).toEqual([5, 1, 9])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.map((i: any) => i.value)).toEqual([42, true, 'hello'])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.map((i: any) => i.value)).toEqual([-100, 42, 0])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items[0].kind).toBe('vec')
      expect(r.items[0].items.map((i: any) => i.value)).toEqual([1, 2])
      expect(r.items[1].items.map((i: any) => i.value)).toEqual([3, 4])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items[0].kind).toBe('vec')
      expect(r.items[0].items[0].kind).toBe('vec')
      expect(r.items[0].items[0].items.map((i: any) => i.value)).toEqual([1, 2])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items[0].items.map((i: any) => i.value)).toEqual([10, false])
      expect(r.items[1].value).toBe(20)
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items[0].items.map((i: any) => i.value)).toEqual([3, 1])
      expect(r.items[1].items.map((i: any) => i.value)).toEqual([2])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items[0].value).toBe(1)
      expect(r.items[1].items.map((i: any) => i.value)).toEqual([2, 3])
      expect(r.items[2].value).toBe(4)
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.map((i: any) => i.value)).toEqual([1, null, 2])
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
      const r: any = result
      expect(r.kind).toBe('vec')
      expect(r.items.map((i: any) => i.value)).toEqual(['transfer', 'approve'])
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
      expect((result).kind).toBe('vec')
      expect((result).items.map((i: any) => i.value)).toEqual([
        100,
        false,
        'test',
        50,
        true,
      ])
    })
  })
})
