import { describe, expect, it } from 'vitest'
import { serializeExpandedNodes } from '../../lib/storage/serializeExpandedNodes'

describe('serializeExpandedNodes', () => {
  it('should serialize simple node arrays into compact JSON', () => {
    expect(serializeExpandedNodes(['node1', 'node2'])).toBe('["node1","node2"]')
  })

  it('should remove duplicates while preserving first occurrence', () => {
    expect(serializeExpandedNodes(['a', 'b', 'a', 'c'])).toBe('["a","b","c"]')
    expect(serializeExpandedNodes(['x', 'y', 'z', 'y', 'x'])).toBe(
      '["x","y","z"]',
    )
  })

  it('should handle empty arrays', () => {
    expect(serializeExpandedNodes([])).toBe('[]')
  })

  it('should preserve input order', () => {
    expect(serializeExpandedNodes(['z', 'a', 'b'])).toBe('["z","a","b"]')
  })

  it('should cap serialized output by retaining the earliest entries', () => {
    const result = serializeExpandedNodes(['a', 'b', 'c', 'd'], 12)
    expect(JSON.parse(result)).toEqual(['a', 'b'])
    expect(result.length).toBeLessThanOrEqual(12)
  })

  it('should keep under-budget results intact', () => {
    const result = serializeExpandedNodes(['a', 'b'], 20)
    expect(JSON.parse(result)).toEqual(['a', 'b'])
  })

  it('should handle non-array inputs gracefully', () => {
    // @ts-ignore - testing runtime behavior for non-string array
    expect(serializeExpandedNodes(null)).toBe('[]')
    // @ts-ignore - testing runtime behavior for non-string array
    expect(serializeExpandedNodes(undefined)).toBe('[]')
  })

  it('should produce compact JSON (no spaces)', () => {
    const result = serializeExpandedNodes(['node1', 'node2'])
    expect(result).not.toContain(' ')
  })

  it('should filter out blank node IDs and preserve valid order', () => {
    expect(
      serializeExpandedNodes(['node1', '', '  ', 'node2', '\n\t', 'node1']),
    ).toBe('["node1","node2"]')
  })
})
