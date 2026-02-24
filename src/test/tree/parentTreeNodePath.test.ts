import { describe, expect, it } from 'vitest'
import { parentTreeNodePath } from '../../lib/tree/parentTreeNodePath'

describe('parentTreeNodePath', () => {
  it('should return the immediate parent path for a normal path', () => {
    expect(parentTreeNodePath('a.b.c')).toBe('a.b')
    expect(parentTreeNodePath('root.child')).toBe('root')
    expect(parentTreeNodePath('1.2.3.4')).toBe('1.2.3')
  })

  it('should handle escaped dots correctly', () => {
    expect(parentTreeNodePath('a.b\\.c.d')).toBe('a.b\\.c')
    expect(parentTreeNodePath('a\\.b.c')).toBe('a\\.b')
    expect(parentTreeNodePath('a.b\\.c')).toBe('a')
  })

  it('should return null for top-level nodes (no parent)', () => {
    expect(parentTreeNodePath('a')).toBeNull()
    expect(parentTreeNodePath('root')).toBeNull()
    expect(parentTreeNodePath('node-with-escaped\\.dot')).toBeNull()
  })

  it('should return null for invalid or empty input', () => {
    expect(parentTreeNodePath('')).toBeNull()
    // @ts-ignore - testing invalid input types
    expect(parentTreeNodePath(null)).toBeNull()
    // @ts-ignore - testing invalid input types
    expect(parentTreeNodePath(undefined)).toBeNull()
  })

  it('should handle multiple escaped dots', () => {
    expect(parentTreeNodePath('a\\.b\\.c.d')).toBe('a\\.b\\.c')
    expect(parentTreeNodePath('a.b\\.c\\.d')).toBe('a')
  })

  it('should handle paths with special characters', () => {
    expect(parentTreeNodePath('node-1.node_2.node$3')).toBe('node-1.node_2')
  })
})
