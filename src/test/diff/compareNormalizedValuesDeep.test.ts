import { describe, expect, it } from 'vitest'

import { compareNormalizedValuesDeep } from '../../lib/diff/compareNormalizedValuesDeep'

describe('compareNormalizedValuesDeep cycle handling', () => {
  it('compares equivalent self-cycles without overflowing', () => {
    const left: Record<string, unknown> = { value: 'same' }
    const right: Record<string, unknown> = { value: 'same' }
    left.self = left
    right.self = right

    expect(compareNormalizedValuesDeep(left, right)).toBe(true)
  })

  it('compares differing self-cycle values as different', () => {
    const left: Record<string, unknown> = { value: 'left' }
    const right: Record<string, unknown> = { value: 'right' }
    left.self = left
    right.self = right

    expect(compareNormalizedValuesDeep(left, right)).toBe(false)
  })

  it('compares equivalent mutual cycles without overflowing', () => {
    const leftFirst: Record<string, unknown> = { value: 'first' }
    const leftSecond: Record<string, unknown> = { value: 'second' }
    leftFirst.next = leftSecond
    leftSecond.next = leftFirst

    const rightFirst: Record<string, unknown> = { value: 'first' }
    const rightSecond: Record<string, unknown> = { value: 'second' }
    rightFirst.next = rightSecond
    rightSecond.next = rightFirst

    expect(compareNormalizedValuesDeep(leftFirst, rightFirst)).toBe(true)
  })
})
