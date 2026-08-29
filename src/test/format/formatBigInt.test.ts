import { describe, expect, it } from 'vitest'
import { formatBigInt } from '../../lib/format/formatBigInt'

describe('formatBigInt', () => {
  it('groups the maximum u64 value without locale dependency', () => {
    expect(formatBigInt('18446744073709551615')).toBe(
      '18,446,744,073,709,551,615',
    )
  })

  it('groups a negative i128 value while preserving its sign', () => {
    expect(formatBigInt('-170141183460469231731687303715884105728')).toBe(
      '-170,141,183,460,469,231,731,687,303,715,884,105,728',
    )
  })

  it('accepts safe number and bigint inputs', () => {
    expect(formatBigInt(1234567)).toBe('1,234,567')
    expect(formatBigInt(0n)).toBe('0')
  })

  it('returns a stable fallback for invalid or imprecise input', () => {
    expect(formatBigInt('not-an-integer')).toBe('-')
    expect(formatBigInt('')).toBe('-')
    expect(formatBigInt(1.5)).toBe('-')
    expect(formatBigInt(Number.MAX_SAFE_INTEGER + 1)).toBe('-')
  })
})
