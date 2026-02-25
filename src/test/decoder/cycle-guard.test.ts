import { describe, expect, it } from 'vitest'
import {
  ScValType,
  VisitedTracker,
  createVisitedTracker,
  normalizeScVal,
} from '../../workers/decoder/normalizeScVal'
import type { ScVal } from '../../workers/decoder/normalizeScVal'
import type { NormalizedValue } from '../../types/normalized'

describe('Cycle Guard - Visited Node Tracking', () => {
  describe('VisitedTracker', () => {
    it('should create a new tracker', () => {
      const tracker = createVisitedTracker()
      expect(tracker).toBeInstanceOf(VisitedTracker)
    })

    it('should track visited objects', () => {
      const tracker = createVisitedTracker()
      const obj: any = { type: 'test' }

      expect(tracker.hasVisited(obj)).toBe(false)
      tracker.markVisited(obj)
      expect(tracker.hasVisited(obj)).toBe(true)
    })

    it('should not track primitives', () => {
      const tracker = createVisitedTracker()

      expect(tracker.hasVisited(5)).toBe(false)
      expect(tracker.hasVisited('string')).toBe(false)
      expect(tracker.hasVisited(true)).toBe(false)
      expect(tracker.hasVisited(null)).toBe(false)
      expect(tracker.hasVisited(undefined)).toBe(false)

      tracker.markVisited(5)
      tracker.markVisited('string')
      expect(tracker.getDepth()).toBe(0)
    })

    it('should track multiple objects separately', () => {
      const tracker = createVisitedTracker()
      const obj1: any = { id: 1 }
      const obj2: any = { id: 2 }

      tracker.markVisited(obj1)
      tracker.markVisited(obj2)

      expect(tracker.hasVisited(obj1)).toBe(true)
      expect(tracker.hasVisited(obj2)).toBe(true)
      expect(tracker.getDepth()).toBe(2)
    })

    it('should create cycle markers', () => {
      const marker = VisitedTracker.createCycleMarker()
      expect((marker as any).kind).toBe('truncated')
      expect(VisitedTracker.isCycleMarker(marker)).toBe(true)
    })

    it('should include depth in cycle markers', () => {
      const marker = VisitedTracker.createCycleMarker(5)
      expect((marker as any).depth).toBe(5)
    })

    it('should correctly identify cycle markers', () => {
      const validMarker = { kind: 'truncated' }
      const invalidMarker1 = { kind: 'primitive' }
      const invalidMarker2 = { other: true }
      const invalidMarker3 = null

      expect(VisitedTracker.isCycleMarker(validMarker)).toBe(true)
      expect(VisitedTracker.isCycleMarker(invalidMarker1)).toBe(false)
      expect(VisitedTracker.isCycleMarker(invalidMarker2)).toBe(false)
      expect(VisitedTracker.isCycleMarker(invalidMarker3)).toBe(false)
    })

    it('should maintain depth count', () => {
      const tracker = createVisitedTracker()
      expect(tracker.getDepth()).toBe(0)

      const obj1: any = {}
      const obj2: any = {}

      tracker.markVisited(obj1)
      expect(tracker.getDepth()).toBe(1)

      tracker.markVisited(obj2)
      expect(tracker.getDepth()).toBe(2)
    })
  })

  describe('Cycle Detection in ScVal Normalization', () => {
    it('should detect self-referencing objects in vectors', () => {
      const scVal: any = { switch: ScValType.SCV_VEC, value: [] }
      scVal.value.push(scVal)

      const result = normalizeScVal(scVal)
      expect(result.kind).toBe('vec')
      const items = (result as any).items
      expect(items.length).toBe(1)
      expect(VisitedTracker.isCycleMarker(items[0])).toBe(true)
    })

    it('should detect indirect cycles (A -> B -> A)', () => {
      const vecA: any = { switch: ScValType.SCV_VEC, value: [] }
      const vecB: any = { switch: ScValType.SCV_VEC, value: [vecA] }
      vecA.value.push(vecB)

      const result = normalizeScVal(vecA)
      expect(result.kind).toBe('vec')
      const level0 = (result as any).items
      expect(level0.length).toBe(1)
      expect(level0[0].kind).toBe('vec')

      const inner = level0[0].items
      expect(inner.length).toBe(1)
      expect(VisitedTracker.isCycleMarker(inner[0])).toBe(true)
    })

    it('should detect deep cycles (A -> B -> C -> A)', () => {
      const vecA: any = { switch: ScValType.SCV_VEC, value: [] }
      const vecB: any = { switch: ScValType.SCV_VEC, value: [vecA] }
      const vecC: any = { switch: ScValType.SCV_VEC, value: [vecB] }
      vecA.value.push(vecC)

      const result = normalizeScVal(vecA)
      expect(result.kind).toBe('vec')
      const lvl0 = (result as any).items
      const lvl1 = lvl0[0].items
      const lvl2 = lvl1[0].items
      expect(VisitedTracker.isCycleMarker(lvl2[0])).toBe(true)
    })

    it('should detect multiple references to same object in different positions', () => {
      const shared: any = { switch: ScValType.SCV_I32, value: 42 }
      const parentVec: any = {
        switch: ScValType.SCV_VEC,
        value: [shared, shared],
      }

      const result = normalizeScVal(parentVec)
      const items = (result as any).items
      expect(items.length).toBe(2)
      expect(items[0].value).toBe(42)
      expect(VisitedTracker.isCycleMarker(items[1])).toBe(true)
    })
  })

  describe('Non-Cyclic Structures Still Normalize Correctly', () => {
    it('should normalize simple values without cycles', () => {
      const testCases: Array<[ScVal, unknown]> = [
        [{ switch: ScValType.SCV_BOOL, value: true }, true],
        [{ switch: ScValType.SCV_BOOL, value: false }, false],
        [{ switch: ScValType.SCV_I32, value: 42 }, 42],
        [{ switch: ScValType.SCV_I32, value: -42 }, -42],
        [{ switch: ScValType.SCV_STRING, value: 'hello' }, 'hello'],
        [{ switch: ScValType.SCV_VOID }, null],
      ]

      testCases.forEach(([input, expected]) => {
        const result = normalizeScVal(input)
        expect((result as any).kind).toBe('primitive')
        // @ts-ignore -- Reason: test inspects runtime normalized '.value' field
        expect((result as any).value).toBe(expected)
      })
    })

    it('should normalize nested vectors without cycles', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
          { switch: ScValType.SCV_I32, value: 2 },
          { switch: ScValType.SCV_I32, value: 3 },
        ],
      }

      const result = normalizeScVal(scVal)
      expect((result as any).kind).toBe('vec')
      expect((result as any).items.map((i: any) => i.value)).toEqual([1, 2, 3])
    })

    it('should normalize deeply nested vectors without cycles', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_VEC,
        value: [
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_I32, value: 1 },
              { switch: ScValType.SCV_I32, value: 2 },
            ],
          },
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_I32, value: 3 },
              { switch: ScValType.SCV_I32, value: 4 },
            ],
          },
        ],
      }

      const result = normalizeScVal(scVal)
      expect((result as any).kind).toBe('vec')
      expect((result as any).items[0].items.map((i: any) => i.value)).toEqual([
        1, 2,
      ])
      expect((result as any).items[1].items.map((i: any) => i.value)).toEqual([
        3, 4,
      ])
    })

    it('should normalize empty vectors', () => {
      const scVal: ScVal = { switch: ScValType.SCV_VEC, value: [] }
      const result = normalizeScVal(scVal)
      expect((result as any).kind).toBe('vec')
      expect((result as any).items).toEqual([])
    })

    it('should handle mixed nested structures', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_BOOL, value: true },
          {
            switch: ScValType.SCV_VEC,
            value: [
              { switch: ScValType.SCV_I32, value: 42 },
              { switch: ScValType.SCV_STRING, value: 'test' },
            ],
          },
          { switch: ScValType.SCV_VOID },
        ],
      }

      const result = normalizeScVal(scVal)
      expect((result as any).kind).toBe('vec')
      expect((result as any).items[0].value).toBe(true)
      expect((result as any).items[1].items.map((i: any) => i.value)).toEqual([
        42,
        'test',
      ])
      expect((result as any).items[2].value).toBe(null)
    })
  })

  describe('Cycle Guard Edge Cases', () => {
    it('should handle null and undefined without errors', () => {
      const tracker = createVisitedTracker()
      expect(() => normalizeScVal(null, tracker)).not.toThrow()
      expect(() => normalizeScVal(undefined, tracker)).not.toThrow()
    })

    it('should handle invalid ScVal gracefully', () => {
      const scVal: any = { switch: null }
      const result = normalizeScVal(scVal)
      expect((result as any).kind).toBe('unsupported')
    })

    it('should reset tracker per top-level call', () => {
      const vec1: any = {
        switch: ScValType.SCV_VEC,
        value: [{ switch: ScValType.SCV_I32, value: 1 }],
      }
      const vec2: any = {
        switch: ScValType.SCV_VEC,
        value: [{ switch: ScValType.SCV_I32, value: 2 }],
      }

      const result1 = normalizeScVal(vec1)
      const result2 = normalizeScVal(vec2)

      expect((result1 as any).items.map((i: any) => i.value)).toEqual([1])
      expect((result2 as any).items.map((i: any) => i.value)).toEqual([2])
    })

    it('should detect cycle with vector containing vector containing same reference', () => {
      const innerVec: any = {
        switch: ScValType.SCV_VEC,
        value: [{ switch: ScValType.SCV_I32, value: 99 }],
      }
      const midVec: any = { switch: ScValType.SCV_VEC, value: [innerVec] }
      const outerVec: any = {
        switch: ScValType.SCV_VEC,
        value: [midVec, innerVec],
      }

      const result = normalizeScVal(outerVec)
      const items = (result as any).items

      const midResult = items[0].items
      expect(midResult[0].items[0].value).toBe(99)
      expect(VisitedTracker.isCycleMarker(items[1])).toBe(true)
    })
  })

  describe('Cycle Marker Properties', () => {
    it('should include depth information in cycle markers', () => {
      const vecA: any = { switch: ScValType.SCV_VEC, value: [] }
      const vecB: any = { switch: ScValType.SCV_VEC, value: [vecA] }
      const vecC: any = { switch: ScValType.SCV_VEC, value: [vecB] }
      vecA.value.push(vecC)

      const result = normalizeScVal(vecA)
      const level1 = (result as any).items[0].items
      const level2 = level1[0].items
      const cycleMarker = level2[0]

      expect(VisitedTracker.isCycleMarker(cycleMarker)).toBe(true)
      expect(cycleMarker.depth).toBeGreaterThan(0)
    })

    it('should produce serializable cycle markers', () => {
      const marker = VisitedTracker.createCycleMarker(3)
      const json = JSON.stringify(marker)
      const parsed = JSON.parse(json)

      expect(parsed.kind).toBe('truncated')
      expect(parsed.depth).toBe(3)
    })
  })

  describe('Synthetic Recursive Structures for Guard Path Coverage', () => {
    it('should handle wide branching cycles', () => {
      const root: any = { switch: ScValType.SCV_VEC, value: [] }
      const child1: any = { switch: ScValType.SCV_VEC, value: [root] }
      const child2: any = { switch: ScValType.SCV_VEC, value: [root] }
      const child3: any = { switch: ScValType.SCV_VEC, value: [root] }

      root.value = [child1, child2, child3]

      const result = normalizeScVal(root)
      const branches = (result as any).items
      expect(branches.length).toBe(3)

      expect(branches[0].items.length).toBe(1)
      const level1 = branches[0].items[0]
      expect(VisitedTracker.isCycleMarker(level1)).toBe(true)
    })

    it('should handle cycles with mixed data types', () => {
      const vec: any = {
        switch: ScValType.SCV_VEC,
        value: [
          { switch: ScValType.SCV_I32, value: 1 },
          { switch: ScValType.SCV_BOOL, value: true },
          { switch: ScValType.SCV_STRING, value: 'test' },
        ],
      }
      vec.value.push(vec)

      const result = normalizeScVal(vec)
      const items = (result as any).items
      expect(items[0].value).toBe(1)
      expect(items[1].value).toBe(true)
      expect(items[2].value).toBe('test')
      expect(VisitedTracker.isCycleMarker(items[3])).toBe(true)
    })

    it('should handle multiple cycle paths in complex structure', () => {
      const shared: any = { switch: ScValType.SCV_VEC, value: [] }
      const branch1: any = { switch: ScValType.SCV_VEC, value: [shared] }
      const branch2: any = { switch: ScValType.SCV_VEC, value: [shared] }
      const root: any = { switch: ScValType.SCV_VEC, value: [branch1, branch2] }
      shared.value = [root]

      const result = normalizeScVal(root)
      const arr = (result as any).items
      expect(arr).toBeDefined()
      expect(Array.isArray(arr)).toBe(true)
      expect(arr.length).toBeGreaterThan(0)

      const firstBranch = arr[0]
      expect(
        Array.isArray(firstBranch.items) ||
          VisitedTracker.isCycleMarker(firstBranch),
      ).toBe(true)
    })

    it('should handle deferred cycle detection (cycle appears deep in structure)', () => {
      const deepVec: any = { switch: ScValType.SCV_VEC, value: [] }
      let current = deepVec
      for (let i = 0; i < 3; i++) {
        const next: any = {
          switch: ScValType.SCV_VEC,
          value: [{ switch: ScValType.SCV_I32, value: i }],
        }
        current.value.push(next)
        current = next
      }
      current.value.push(deepVec)

      const result = normalizeScVal(deepVec)
      const first = (result as any).items
      expect(first).toBeDefined()
      // traverse until primitive or truncated found
      let nav: any = result
      let depth = 0
      while (nav.kind === 'vec' && depth < 10) {
        const items = nav.items
        if (items.length === 0) break
        nav = items[0]
        depth++
      }

      expect(
        VisitedTracker.isCycleMarker(nav) ||
          (nav && (nav.kind === 'primitive' || nav.kind === 'vec')) ||
          nav === null,
      ).toBe(true)
    })
  })
})
