import { describe, expect, it } from 'vitest'
import {
  ScValType,
  VisitedTracker,
  createVisitedTracker,
  normalizeScVal,
} from '../../workers/decoder/normalizeScVal'
import type {
  CycleMarker,
  NormalizedValue,
  ScVal,
} from '../../workers/decoder/normalizeScVal'

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

      // Primitives should not be added to tracker
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
      expect(marker.__cycle).toBe(true)
      expect(VisitedTracker.isCycleMarker(marker)).toBe(true)
    })

    it('should include depth in cycle markers', () => {
      const marker = VisitedTracker.createCycleMarker(5)
      expect(marker.depth).toBe(5)
    })

    it('should correctly identify cycle markers', () => {
      const validMarker: CycleMarker = { __cycle: true }
      const invalidMarker1 = { __cycle: false }
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
      // Create a self-referencing structure
      const scVal: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }
      // Add self-reference
      scVal.value.push(scVal)

      const result = normalizeScVal(scVal)
      expect(Array.isArray(result)).toBe(true)
      const resultArray = result as Array<NormalizedValue>
      expect(resultArray.length).toBe(1)
      expect(VisitedTracker.isCycleMarker(resultArray[0])).toBe(true)
    })

    it('should detect indirect cycles (A -> B -> A)', () => {
      const vecA: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }
      const vecB: any = {
        switch: ScValType.SCV_VEC,
        value: [vecA],
      }
      vecA.value.push(vecB)

      const result = normalizeScVal(vecA)
      expect(Array.isArray(result)).toBe(true)
      const resultArray = result as Array<NormalizedValue>
      expect(resultArray.length).toBe(1)
      expect(Array.isArray(resultArray[0])).toBe(true)

      const innerArray = resultArray[0] as Array<NormalizedValue>
      expect(innerArray.length).toBe(1)
      expect(VisitedTracker.isCycleMarker(innerArray[0])).toBe(true)
    })

    it('should detect deep cycles (A -> B -> C -> A)', () => {
      const vecA: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }
      const vecB: any = {
        switch: ScValType.SCV_VEC,
        value: [vecA],
      }
      const vecC: any = {
        switch: ScValType.SCV_VEC,
        value: [vecB],
      }
      vecA.value.push(vecC)

      const result = normalizeScVal(vecA)
      expect(Array.isArray(result)).toBe(true)
      const resultArray = result as Array<NormalizedValue>
      expect(resultArray.length).toBe(1)
      expect(Array.isArray(resultArray[0])).toBe(true)

      const level1 = resultArray[0] as Array<NormalizedValue>
      expect(level1.length).toBe(1)
      expect(Array.isArray(level1[0])).toBe(true)

      const level2 = level1[0] as Array<NormalizedValue>
      expect(level2.length).toBe(1)
      expect(VisitedTracker.isCycleMarker(level2[0])).toBe(true)
    })

    it('should detect multiple references to same object in different positions', () => {
      const shared: any = {
        switch: ScValType.SCV_I32,
        value: 42,
      }
      const parentVec: any = {
        switch: ScValType.SCV_VEC,
        value: [shared, shared],
      }

      // First reference should normalize, second should be cycle marker
      const result = normalizeScVal(parentVec)
      expect(Array.isArray(result)).toBe(true)
      const resultArray = result as Array<NormalizedValue>
      expect(resultArray.length).toBe(2)
      expect(resultArray[0]).toBe(42) // First reference succeeds
      expect(VisitedTracker.isCycleMarker(resultArray[1])).toBe(true) // Second is cycle
    })
  })

  describe('Non-Cyclic Structures Still Normalize Correctly', () => {
    it('should normalize simple values without cycles', () => {
      const testCases: Array<[ScVal, NormalizedValue]> = [
        [{ switch: ScValType.SCV_BOOL, value: true }, true],
        [{ switch: ScValType.SCV_BOOL, value: false }, false],
        [{ switch: ScValType.SCV_I32, value: 42 }, 42],
        [{ switch: ScValType.SCV_I32, value: -42 }, -42],
        [{ switch: ScValType.SCV_STRING, value: 'hello' }, 'hello'],
        [{ switch: ScValType.SCV_VOID }, null],
      ]

      testCases.forEach(([input, expected]) => {
        const result = normalizeScVal(input)
        expect(result).toBe(expected)
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
      expect(result).toEqual([1, 2, 3])
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
      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ])
    })

    it('should normalize empty vectors', () => {
      const scVal: ScVal = {
        switch: ScValType.SCV_VEC,
        value: [],
      }

      const result = normalizeScVal(scVal)
      expect(result).toEqual([])
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
      expect(result).toEqual([true, [42, 'test'], null])
    })
  })

  describe('Cycle Guard Edge Cases', () => {
    it('should handle null and undefined without errors', () => {
      const tracker = createVisitedTracker()
      expect(() => normalizeScVal(null, tracker)).not.toThrow()
      expect(() => normalizeScVal(undefined, tracker)).not.toThrow()
    })

    it('should handle invalid ScVal gracefully', () => {
      const scVal: any = {
        switch: null,
      }

      const result = normalizeScVal(scVal)
      expect(result).toHaveProperty('__unsupported', true)
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

      // Each call gets its own tracker
      const result1 = normalizeScVal(vec1)
      const result2 = normalizeScVal(vec2)

      expect(result1).toEqual([1])
      expect(result2).toEqual([2])
    })

    it('should detect cycle with vector containing vector containing same reference', () => {
      const innerVec: any = {
        switch: ScValType.SCV_VEC,
        value: [{ switch: ScValType.SCV_I32, value: 99 }],
      }

      const midVec: any = {
        switch: ScValType.SCV_VEC,
        value: [innerVec],
      }

      const outerVec: any = {
        switch: ScValType.SCV_VEC,
        value: [midVec, innerVec], // innerVec appears twice
      }

      const result = normalizeScVal(outerVec)
      expect(Array.isArray(result)).toBe(true)
      const resultArray = result as Array<NormalizedValue>

      // First element: [[99]]
      expect(Array.isArray(resultArray[0])).toBe(true)
      const midResult = resultArray[0] as Array<NormalizedValue>
      expect(Array.isArray(midResult[0])).toBe(true)
      expect((midResult[0] as Array<NormalizedValue>)[0]).toBe(99)

      // Second element: should be cycle marker since innerVec already visited
      expect(VisitedTracker.isCycleMarker(resultArray[1])).toBe(true)
    })
  })

  describe('Cycle Marker Properties', () => {
    it('should include depth information in cycle markers', () => {
      const vecA: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }
      const vecB: any = {
        switch: ScValType.SCV_VEC,
        value: [vecA],
      }
      const vecC: any = {
        switch: ScValType.SCV_VEC,
        value: [vecB],
      }
      vecA.value.push(vecC)

      const result = normalizeScVal(vecA)
      const resultArray = result as Array<NormalizedValue>
      const level1 = resultArray[0] as Array<NormalizedValue>
      const level2 = level1[0] as Array<NormalizedValue>
      const cycleMarker = level2[0] as CycleMarker

      expect(VisitedTracker.isCycleMarker(cycleMarker)).toBe(true)
      expect(cycleMarker.depth).toBeGreaterThan(0)
    })

    it('should produce serializable cycle markers', () => {
      const marker = VisitedTracker.createCycleMarker(3)
      const json = JSON.stringify(marker)
      const parsed = JSON.parse(json)

      expect(parsed.__cycle).toBe(true)
      expect(parsed.depth).toBe(3)
    })
  })

  describe('Synthetic Recursive Structures for Guard Path Coverage', () => {
    it('should handle wide branching cycles', () => {
      const root: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }

      const child1: any = {
        switch: ScValType.SCV_VEC,
        value: [root],
      }
      const child2: any = {
        switch: ScValType.SCV_VEC,
        value: [root],
      }
      const child3: any = {
        switch: ScValType.SCV_VEC,
        value: [root],
      }

      root.value = [child1, child2, child3]

      const result = normalizeScVal(root) as Array<NormalizedValue>
      expect(result.length).toBe(3)

      // First child processes normally
      expect(Array.isArray(result[0])).toBe(true)
      expect((result[0] as Array<NormalizedValue>).length).toBe(1)

      // result[0] contains the normalized child1, which contains cycle marker for root
      const level1 = (result[0] as Array<NormalizedValue>)[0]
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
      // Add self-reference as last element
      vec.value.push(vec)

      const result = normalizeScVal(vec) as Array<NormalizedValue>
      expect(result[0]).toBe(1)
      expect(result[1]).toBe(true)
      expect(result[2]).toBe('test')
      expect(VisitedTracker.isCycleMarker(result[3])).toBe(true)
    })

    it('should handle multiple cycle paths in complex structure', () => {
      const shared: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }

      const branch1: any = {
        switch: ScValType.SCV_VEC,
        value: [shared],
      }

      const branch2: any = {
        switch: ScValType.SCV_VEC,
        value: [shared],
      }

      const root: any = {
        switch: ScValType.SCV_VEC,
        value: [branch1, branch2],
      }

      shared.value = [root]

      const result = normalizeScVal(root) as Array<NormalizedValue>
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      // The structure should normalize without infinite recursion
      // and contain cycle markers where appropriate
      // Result format: [[...], [...]] where branches contain normalized shared references
      expect(result.length).toBeGreaterThan(0)

      // Check that result contains arrays (the normalized branches)
      const firstBranch = result[0]
      expect(
        Array.isArray(firstBranch) || VisitedTracker.isCycleMarker(firstBranch),
      ).toBe(true)
    })

    it('should handle deferred cycle detection (cycle appears deep in structure)', () => {
      // Create a structure where cycle only appears at depth n
      const deepVec: any = {
        switch: ScValType.SCV_VEC,
        value: [],
      }

      let current = deepVec
      // Build a chain of 3 nested vectors
      for (let i = 0; i < 3; i++) {
        const next: any = {
          switch: ScValType.SCV_VEC,
          value: [{ switch: ScValType.SCV_I32, value: i }],
        }
        current.value.push(next)
        current = next
      }

      // Add cycle back to deepVec
      current.value.push(deepVec)

      const result = normalizeScVal(deepVec)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      // Navigate through the structure and verify it completes without infinite recursion
      let nav: unknown = result
      let depth = 0
      while (Array.isArray(nav) && depth < 10) {
        if (nav.length === 0) break
        nav = nav[0]
        depth++
      }

      // Should eventually hit a cycle marker or complete
      expect(
        VisitedTracker.isCycleMarker(nav) ||
          typeof nav === 'number' ||
          nav === null ||
          typeof nav === 'boolean',
      ).toBe(true)
    })
  })
})
