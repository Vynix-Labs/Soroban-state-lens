// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isFunctionName } from '../../lib/validation/isFunctionName'

describe('isFunctionName', () => {
  it('should return true for valid function names', () => {
    expect(isFunctionName('transfer')).toBe(true)
    expect(isFunctionName('mint')).toBe(true)
    expect(isFunctionName('balance_of')).toBe(true)
    expect(isFunctionName('get_price')).toBe(true)
    expect(isFunctionName('initialize')).toBe(true)
    expect(isFunctionName('_private')).toBe(true)
    expect(isFunctionName('a')).toBe(true)
    expect(isFunctionName('fn1')).toBe(true)
  })

  it('should return false for blank strings', () => {
    expect(isFunctionName('')).toBe(false)
    expect(isFunctionName('   ')).toBe(false)
    expect(isFunctionName('\t')).toBe(false)
    expect(isFunctionName('\n')).toBe(false)
  })

  it('should return false for names starting with a digit', () => {
    expect(isFunctionName('1transfer')).toBe(false)
    expect(isFunctionName('123')).toBe(false)
  })

  it('should return false for names with uppercase letters', () => {
    expect(isFunctionName('Transfer')).toBe(false)
    expect(isFunctionName('getBalance')).toBe(false)
    expect(isFunctionName('MINT')).toBe(false)
  })

  it('should return false for names with invalid characters', () => {
    expect(isFunctionName('hello-world')).toBe(false)
    expect(isFunctionName('hello world')).toBe(false)
    expect(isFunctionName('fn!')).toBe(false)
    expect(isFunctionName('fn@name')).toBe(false)
    expect(isFunctionName('fn.name')).toBe(false)
    expect(isFunctionName('fn::name')).toBe(false)
    expect(isFunctionName('fn()')).toBe(false)
  })

  it('should accept names with leading/trailing whitespace after trimming', () => {
    expect(isFunctionName('  transfer  ')).toBe(true)
    expect(isFunctionName('\ttransfer\n')).toBe(true)
  })

  it('should return false for names exceeding 64 characters', () => {
    const longName = 'a'.repeat(65)
    expect(isFunctionName(longName)).toBe(false)
  })

  it('should return true for names at exactly 64 characters', () => {
    const maxName = 'a'.repeat(64)
    expect(isFunctionName(maxName)).toBe(true)
  })

  it('should return false for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(isFunctionName(null)).toBe(false)
    // @ts-ignore - testing runtime behavior
    expect(isFunctionName(undefined)).toBe(false)
    // @ts-ignore - testing runtime behavior
    expect(isFunctionName(123)).toBe(false)
  })
})
