import { describe, expect, it } from 'vitest'
import { normalizeRpcUrl } from '../../lib/validation/normalizeRpcUrl'

describe('normalizeRpcUrl', () => {
  it('should normalize simple URLs', () => {
    expect(normalizeRpcUrl('https://rpc.example.com')).toBe(
      'https://rpc.example.com',
    )
  })

  it('should trim whitespace', () => {
    expect(normalizeRpcUrl('  https://rpc.example.com  ')).toBe(
      'https://rpc.example.com',
    )
  })

  it('should remove trailing slashes', () => {
    expect(normalizeRpcUrl('https://rpc.example.com/')).toBe(
      'https://rpc.example.com',
    )
    expect(normalizeRpcUrl('https://rpc.example.com///')).toBe(
      'https://rpc.example.com',
    )
  })

  it('should lowercase the protocol', () => {
    expect(normalizeRpcUrl('HTTPS://rpc.example.com')).toBe(
      'https://rpc.example.com',
    )
    expect(normalizeRpcUrl('hTTpS://rpc.example.com')).toBe(
      'https://rpc.example.com',
    )
  })

  it('should preserve pathname, query, and hash while removing trailing slash from path', () => {
    expect(normalizeRpcUrl('https://rpc.example.com/v1/')).toBe(
      'https://rpc.example.com/v1',
    )
    expect(normalizeRpcUrl('https://rpc.example.com/v1?query=1')).toBe(
      'https://rpc.example.com/v1?query=1',
    )
    expect(normalizeRpcUrl('https://rpc.example.com/v1/?query=1')).toBe(
      'https://rpc.example.com/v1?query=1',
    )
    expect(normalizeRpcUrl('https://rpc.example.com/v1#hash')).toBe(
      'https://rpc.example.com/v1#hash',
    )
    expect(normalizeRpcUrl('https://rpc.example.com/v1/?query=1#hash')).toBe(
      'https://rpc.example.com/v1?query=1#hash',
    )
  })

  it('should return empty string for invalid URLs', () => {
    expect(normalizeRpcUrl('')).toBe('')
    expect(normalizeRpcUrl('   ')).toBe('')
    expect(normalizeRpcUrl('not-a-url')).toBe('')
    // @ts-ignore - testing runtime behavior for non-string
    expect(normalizeRpcUrl(null)).toBe('')
  })

  it('should handle repeated trailing slashes in path correctly', () => {
    expect(normalizeRpcUrl('https://rpc.example.com/path//')).toBe(
      'https://rpc.example.com/path',
    )
  })
})
