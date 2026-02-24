import { describe, expect, it } from 'vitest'
import { parseTreeNodePath } from '../../lib/tree/parseTreeNodePath'

describe('parseTreeNodePath', () => {
  it('should decode a simple dot-joined path', () => {
    expect(parseTreeNodePath('a.b.c')).toEqual(['a', 'b', 'c'])
  })

  it('should handle escaped dots', () => {
    expect(parseTreeNodePath('a\\.b.c')).toEqual(['a.b', 'c'])
    expect(parseTreeNodePath('a.b\\.c')).toEqual(['a', 'b.c'])
    expect(parseTreeNodePath('a\\.b\\.c')).toEqual(['a.b.c'])
  })

  it('should handle escaped backslashes', () => {
    expect(parseTreeNodePath('a\\\\.b')).toEqual(['a\\', 'b'])
    expect(parseTreeNodePath('a\\\\\\.b')).toEqual(['a\\.b'])
  })

  it('should return an empty array for invalid escape sequences', () => {
    // Trailing backslash is invalid
    expect(parseTreeNodePath('a.b\\')).toEqual([])
    expect(parseTreeNodePath('a\\')).toEqual([])
    expect(parseTreeNodePath('\\')).toEqual([])
  })

  it('should handle empty string as empty path', () => {
    expect(parseTreeNodePath('')).toEqual([])
  })

  it('should handle multiple consecutive dots (empty segments)', () => {
    expect(parseTreeNodePath('a..b')).toEqual(['a', '', 'b'])
    expect(parseTreeNodePath('.')).toEqual(['', ''])
    expect(parseTreeNodePath('..')).toEqual(['', '', ''])
  })

  it('should handle paths with special characters', () => {
    expect(parseTreeNodePath('user@domain.com/path')).toEqual([
      'user@domain',
      'com/path',
    ])
    expect(parseTreeNodePath('a\\ b')).toEqual(['a b'])
  })

  it('should handle complex mixed cases', () => {
    expect(parseTreeNodePath('a\\.b\\\\.c\\..d')).toEqual(['a.b\\', 'c.', 'd'])
  })
})
