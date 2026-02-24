// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { selectExpandedNodeCount } from '../../lib/selectors/selectExpandedNodeCount'
import type { LensStore } from '../../store/types'

function makeState(expandedNodes: unknown): LensStore {
  return { expandedNodes } as unknown as LensStore
}

describe('selectExpandedNodeCount', () => {
  it('should return the count of expanded nodes', () => {
    expect(selectExpandedNodeCount(makeState(['a', 'b', 'c']))).toBe(3)
  })

  it('should return 1 for a single node', () => {
    expect(selectExpandedNodeCount(makeState(['node1']))).toBe(1)
  })

  it('should count only unique node IDs', () => {
    expect(selectExpandedNodeCount(makeState(['a', 'b', 'a', 'c', 'b']))).toBe(3)
  })

  it('should return 0 for an empty array', () => {
    expect(selectExpandedNodeCount(makeState([]))).toBe(0)
  })

  it('should return 0 when expandedNodes is null', () => {
    expect(selectExpandedNodeCount(makeState(null))).toBe(0)
  })

  it('should return 0 when expandedNodes is undefined', () => {
    expect(selectExpandedNodeCount(makeState(undefined))).toBe(0)
  })

  it('should return 0 when expandedNodes is not an array', () => {
    expect(selectExpandedNodeCount(makeState('string'))).toBe(0)
    expect(selectExpandedNodeCount(makeState(123))).toBe(0)
    expect(selectExpandedNodeCount(makeState({}))).toBe(0)
  })
})
