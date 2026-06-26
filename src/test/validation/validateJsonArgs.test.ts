// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { validateJsonArgs } from '../../lib/validation/validateJsonArgs'

describe('validateJsonArgs', () => {
  it('should pass for valid JSON objects', () => {
    const input = '{"name": "Soroban", "version": 1, "active": true}'
    const result = validateJsonArgs(input)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.parsed).toEqual({
      name: 'Soroban',
      version: 1,
      active: true,
    })
  })

  it('should pass for valid JSON arrays', () => {
    const input = '[1, "two", {"key": "val"}, [true, null]]'
    const result = validateJsonArgs(input)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.parsed).toEqual([
      1,
      'two',
      { key: 'val' },
      [true, null],
    ])
  })

  it('should pass for valid JSON primitives', () => {
    expect(validateJsonArgs('"hello"').valid).toBe(true)
    expect(validateJsonArgs('"hello"').parsed).toBe('hello')
    
    expect(validateJsonArgs('42').valid).toBe(true)
    expect(validateJsonArgs('42').parsed).toBe(42)
    
    expect(validateJsonArgs('true').valid).toBe(true)
    expect(validateJsonArgs('true').parsed).toBe(true)
    
    expect(validateJsonArgs('null').valid).toBe(true)
    expect(validateJsonArgs('null').parsed).toBeNull()
  })

  it('should pass for empty input and resolve to empty array', () => {
    // undefined / null
    expect(validateJsonArgs(undefined).valid).toBe(true)
    expect(validateJsonArgs(undefined).parsed).toEqual([])

    expect(validateJsonArgs(null).valid).toBe(true)
    expect(validateJsonArgs(null).parsed).toEqual([])

    // empty string
    expect(validateJsonArgs('').valid).toBe(true)
    expect(validateJsonArgs('').parsed).toEqual([])

    // whitespace-only string
    expect(validateJsonArgs('    ').valid).toBe(true)
    expect(validateJsonArgs('    ').parsed).toEqual([])
    
    expect(validateJsonArgs('\n\t').valid).toBe(true)
    expect(validateJsonArgs('\n\t').parsed).toEqual([])
  })

  it('should fail for malformed JSON', () => {
    const malformedCases = [
      '{',
      '[1, 2,',
      '{"key": "value",}', // trailing comma in JSON
      'some random text',
      '{"key": val}', // unquoted string value
    ]

    malformedCases.forEach((input) => {
      const result = validateJsonArgs(input)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid JSON format:')
      expect(result.parsed).toBeUndefined()
    })
  })

  it('should fail for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(validateJsonArgs(123).valid).toBe(false)
    // @ts-ignore - testing runtime behavior
    expect(validateJsonArgs(true).valid).toBe(false)
    // @ts-ignore - testing runtime behavior
    expect(validateJsonArgs({}).valid).toBe(false)
  })
})
