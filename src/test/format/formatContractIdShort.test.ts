import { describe, expect, test } from 'vitest'
import { formatContractIdShort } from '../../lib/format/formatContractIdShort'

describe('formatContractIdShort', () => {
  test('returns shortened version for long ID with default head/tail', () => {
    // contractId length = 56
    const fullId = 'CB7Q7XU7P6P7P6P7P6P7P6P7P6P7P6P7P6P7P6P7P6P7P6P7P6P7P6P7'
    const formatted = formatContractIdShort(fullId)
    // head = 6, tail = 4
    // head: "CB7Q7X"
    // tail: "6P7" - wait, length is 56. 56 - 4 = 52. Substring(52) is "6P7" (let's check)
    // Index 52, 53, 54, 55 (4 characters)
    // Length is 56. Substring(52) gives 56-52 = 4 chars.
    expect(formatted).toBe('CB7Q7X...P6P7') // CB7Q7X (6) ... P6P7 (4)
    // Wait, let's just use a simpler example string.
    const testId = '1234567890ABCDEF' // length 16
    // head=6, tail=4 => "123456...CDEF"
    expect(formatContractIdShort(testId)).toBe('123456...CDEF')
  })

  test('returns original string if it is exactly head + tail', () => {
    const shortId = '1234567890' // length 10
    expect(formatContractIdShort(shortId, 6, 4)).toBe('1234567890')
  })

  test('returns original string if it is shorter than head + tail', () => {
    const shortId = '12345'
    expect(formatContractIdShort(shortId, 6, 4)).toBe('12345')
  })

  test('handles custom head and tail', () => {
    const id = '1234567890ABCDEF'
    // head=3, tail=2 => 123...EF
    expect(formatContractIdShort(id, 3, 2)).toBe('123...EF')
  })

  test('returns "-" for empty or blank input', () => {
    expect(formatContractIdShort('')).toBe('-')
    expect(formatContractIdShort('   ')).toBe('-')
    // @ts-ignore - testing invalid input
    expect(formatContractIdShort(null)).toBe('-')
    // @ts-ignore - testing invalid input
    expect(formatContractIdShort(undefined)).toBe('-')
  })

  test('returns "-" for non-string input', () => {
    // @ts-ignore - testing invalid input
    expect(formatContractIdShort(123)).toBe('-')
  })

  test('uses documented defaults for invalid length options and preserves zero-length handling', () => {
    const id = '1234567890ABCDEF'

    expect(formatContractIdShort(id, -1, 2)).toBe('123456...EF')
    expect(formatContractIdShort(id, 2.5, 2)).toBe('123456...EF')
    expect(formatContractIdShort(id, Number.NaN, 2)).toBe('123456...EF')
    expect(formatContractIdShort(id, Number.POSITIVE_INFINITY, 2)).toBe('123456...EF')
    expect(formatContractIdShort(id, 0, 2)).toBe('...EF')
    expect(formatContractIdShort(id, 2, 0)).toBe('12...')
  })
})
