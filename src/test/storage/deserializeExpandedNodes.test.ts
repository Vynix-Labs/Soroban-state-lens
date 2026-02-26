import { describe, expect, it } from 'vitest'
import { deserializeExpandedNodes } from '../../lib/storage/deserializeExpandedNodes'

describe('deserializeExpandedNodes', () => {
  it('should deserialize a valid JSON array of strings', () => {
    const raw = '["node1","node2"]'
    expect(deserializeExpandedNodes(raw)).toEqual(['node1', 'node2'])
  })

  it('should deduplicate entries', () => {
    const raw = '["a","b","a","c"]'
    expect(deserializeExpandedNodes(raw)).toEqual(['a', 'b', 'c'])
  })

  it('should return an empty array for invalid JSON', () => {
    const raw = 'not-json'
    expect(deserializeExpandedNodes(raw)).toEqual([])
  })

  it('should return an empty array for non-array payloads', () => {
    const raw = '{"key":"value"}'
    expect(deserializeExpandedNodes(raw)).toEqual([])
  })

  it('should return an empty array for arrays with non-string entries', () => {
    const raw = '["node1", 2, "node3"]'
    expect(deserializeExpandedNodes(raw)).toEqual([])
  })

  it('should return an empty array for null/empty raw strings', () => {
    expect(deserializeExpandedNodes('')).toEqual([])
    // @ts-expect-error null not string
    expect(deserializeExpandedNodes(null)).toEqual([])
  })

  it('should handle empty JSON arrays', () => {
    expect(deserializeExpandedNodes('[]')).toEqual([])
  })
})
