import { describe, expect, it } from 'vitest'
import { buildTreeNodePath } from '../../lib/tree/buildTreeNodePath'

describe('buildTreeNodePath', () => {
  describe('happy path', () => {
    it('should join simple parts with dots', () => {
      expect(buildTreeNodePath(['a', 'b', 'c'])).toBe('a.b.c')
      expect(buildTreeNodePath(['root', 'child'])).toBe('root.child')
      expect(buildTreeNodePath(['1', '2', '3'])).toBe('1.2.3')
    })

    it('should handle single part paths', () => {
      expect(buildTreeNodePath(['root'])).toBe('root')
      expect(buildTreeNodePath(['single'])).toBe('single')
      expect(buildTreeNodePath(['123'])).toBe('123')
    })

    it('should escape literal dots in parts', () => {
      expect(buildTreeNodePath(['a.b', 'c'])).toBe('a\\.b.c')
      expect(buildTreeNodePath(['root', 'child.node'])).toBe(
        'root.child\\.node',
      )
      expect(buildTreeNodePath(['file.txt', 'data'])).toBe('file\\.txt.data')
    })

    it('should escape multiple dots in a single part', () => {
      expect(buildTreeNodePath(['a.b.c'])).toBe('a\\.b\\.c')
      expect(buildTreeNodePath(['many.dots.here'])).toBe('many\\.dots\\.here')
    })

    it('should escape backslashes in parts', () => {
      expect(buildTreeNodePath(['a\\b', 'c'])).toBe('a\\\\b.c')
      expect(buildTreeNodePath(['root', 'path\\to'])).toBe('root.path\\\\to')
    })

    it('should escape both dots and backslashes', () => {
      expect(buildTreeNodePath(['a.b\\c', 'd'])).toBe('a\\.b\\\\c.d')
      expect(buildTreeNodePath(['file\\.txt', 'data'])).toBe(
        'file\\\\\\.txt.data',
      )
    })

    it('should handle complex mixed escaping', () => {
      expect(buildTreeNodePath(['a.b\\c.d', 'e\\f.g'])).toBe(
        'a\\.b\\\\c\\.d.e\\\\f\\.g',
      )
    })

    it('should handle special characters that are not dots or backslashes', () => {
      expect(buildTreeNodePath(['a-b', 'c_d', 'e/f'])).toBe('a-b.c_d.e/f')
      expect(buildTreeNodePath(['node@domain', 'user#tag'])).toBe(
        'node@domain.user#tag',
      )
    })
  })

  describe('invalid input', () => {
    it('should reject empty array', () => {
      expect(() => buildTreeNodePath([])).toThrow(
        'Path parts array cannot be empty',
      )
    })

    it('should reject null array', () => {
      expect(() => buildTreeNodePath(null as any)).toThrow(
        'Path parts array cannot be empty',
      )
    })

    it('should reject undefined array', () => {
      expect(() => buildTreeNodePath(undefined as any)).toThrow(
        'Path parts array cannot be empty',
      )
    })

    it('should reject empty string parts', () => {
      expect(() => buildTreeNodePath([''])).toThrow(
        'Path part cannot be empty or whitespace-only',
      )
      expect(() => buildTreeNodePath(['a', '', 'b'])).toThrow(
        'Path part cannot be empty or whitespace-only',
      )
    })

    it('should reject whitespace-only parts', () => {
      expect(() => buildTreeNodePath(['   '])).toThrow(
        'Path part cannot be empty or whitespace-only',
      )
      expect(() => buildTreeNodePath(['a', '\t', 'b'])).toThrow(
        'Path part cannot be empty or whitespace-only',
      )
      expect(() => buildTreeNodePath(['a', '\n', 'b'])).toThrow(
        'Path part cannot be empty or whitespace-only',
      )
    })

    it('should reject null parts', () => {
      expect(() => buildTreeNodePath([null as any])).toThrow(
        'Path part cannot be null or undefined',
      )
      expect(() => buildTreeNodePath(['a', null as any, 'b'])).toThrow(
        'Path part cannot be null or undefined',
      )
    })

    it('should reject undefined parts', () => {
      expect(() => buildTreeNodePath([undefined as any])).toThrow(
        'Path part cannot be null or undefined',
      )
      expect(() => buildTreeNodePath(['a', undefined as any, 'b'])).toThrow(
        'Path part cannot be null or undefined',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle parts with only backslashes', () => {
      expect(buildTreeNodePath(['\\\\'])).toBe('\\\\\\\\')
      expect(buildTreeNodePath(['a', '\\\\', 'b'])).toBe('a.\\\\\\\\.b')
    })

    it('should handle parts with consecutive dots', () => {
      expect(buildTreeNodePath(['a..b'])).toBe('a\\.\\.b')
      expect(buildTreeNodePath(['...'])).toBe(`${'\\.'}${'\\.'}${'\\.'}`)
    })

    it('should handle parts with consecutive backslashes', () => {
      expect(buildTreeNodePath(['a\\\\b'])).toBe('a\\\\\\\\b')
      expect(buildTreeNodePath(['\\\\\\\\'])).toBe('\\\\\\\\\\\\\\\\')
    })

    it('should handle parts starting or ending with dots', () => {
      expect(buildTreeNodePath(['.abc'])).toBe(`${'\\.'}abc`)
      expect(buildTreeNodePath(['abc.'])).toBe(`abc${'\\.'}`)
      expect(buildTreeNodePath(['.abc.'])).toBe(`${'\\.'}abc${'\\.'}`)
    })

    it('should handle parts starting or ending with backslashes', () => {
      expect(buildTreeNodePath(['\\abc'])).toBe('\\\\abc')
      expect(buildTreeNodePath(['abc\\'])).toBe('abc\\\\')
      expect(buildTreeNodePath(['\\abc\\'])).toBe('\\\\abc\\\\')
    })

    it('should handle very long parts', () => {
      const longPart = 'a'.repeat(1000)
      expect(buildTreeNodePath([longPart])).toBe(longPart)
      expect(buildTreeNodePath(['short', longPart, 'end'])).toBe(
        `short.${longPart}.end`,
      )
    })

    it('should handle arrays with many parts', () => {
      const manyParts = Array.from({ length: 100 }, (_, i) => `part${i}`)
      const expected = manyParts.join('.')
      expect(buildTreeNodePath(manyParts)).toBe(expected)
    })

    it('should handle unicode characters', () => {
      expect(buildTreeNodePath(['café', 'résumé', 'naïve'])).toBe(
        'café.résumé.naïve',
      )
      expect(buildTreeNodePath(['测试', '🚀'])).toBe('测试.🚀')
    })

    it('should handle emoji and special unicode', () => {
      expect(buildTreeNodePath(['🌟.star'])).toBe('🌟\\.star')
      expect(buildTreeNodePath(['rocket🚀.launch'])).toBe('rocket🚀\\.launch')
    })
  })
})
