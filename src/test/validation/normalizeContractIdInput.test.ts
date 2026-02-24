import { describe, expect, it } from 'vitest'
import { normalizeContractIdInput } from '../../lib/validation/normalizeContractIdInput'

describe('normalizeContractIdInput', () => {
  it('should trim leading and trailing whitespace', () => {
    const input = '  CC123ABC  '
    const result = normalizeContractIdInput(input)
    expect(result).toBe('CC123ABC')
  })

  it('should remove internal spaces', () => {
    const input = 'C C 1 2 3 A B C'
    const result = normalizeContractIdInput(input)
    expect(result).toBe('CC123ABC')
  })

  it('should convert to uppercase', () => {
    const input = 'cc123abc'
    const result = normalizeContractIdInput(input)
    expect(result).toBe('CC123ABC')
  })

  it('should handle complex combination of spaces and mixed case', () => {
    const input = '  Cc 123 aBc  '
    const result = normalizeContractIdInput(input)
    expect(result).toBe('CC123ABC')
  })

  it('should return empty string for blank input', () => {
    const input = '   '
    const result = normalizeContractIdInput(input)
    expect(result).toBe('')
  })

  it('should return empty string for empty input', () => {
    const input = ''
    const result = normalizeContractIdInput(input)
    expect(result).toBe('')
  })

  it('should handle nullish or non-string values gracefully', () => {
    // Testing invalid types cast as any to ensure robustness
    expect(normalizeContractIdInput(null as any)).toBe('')
    expect(normalizeContractIdInput(undefined as any)).toBe('')
    expect(normalizeContractIdInput(123 as any)).toBe('')
    expect(normalizeContractIdInput({} as any)).toBe('')
  })
})
