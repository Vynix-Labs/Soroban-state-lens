// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toRpcRequestId } from '../../lib/rpc/toRpcRequestId'

describe('toRpcRequestId', () => {
  it('should return a positive integer when no seed is provided', () => {
    const id1 = toRpcRequestId()
    const id2 = toRpcRequestId()
    expect(id1).toBeGreaterThan(0)
    expect(id2).toBeGreaterThan(id1)
  })

  it('should return a deterministic integer when a seed is provided', () => {
    const seed = 123
    const id1 = toRpcRequestId(seed)
    const id2 = toRpcRequestId(seed)
    expect(id1).toBe(id2)
    expect(id1).toBe(123)
  })

  it('should handle non-integer seeds by truncating', () => {
    expect(toRpcRequestId(123.456)).toBe(123)
    expect(toRpcRequestId(123.999)).toBe(123)
  })

  it('should handle negative seeds by taking absolute value', () => {
    expect(toRpcRequestId(-456)).toBe(456)
  })

  it('should return 1 for invalid seeds (NaN, Infinity)', () => {
    expect(toRpcRequestId(NaN)).toBe(1)
    expect(toRpcRequestId(Infinity)).toBe(1)
    expect(toRpcRequestId(-Infinity)).toBe(1)
    expect(toRpcRequestId(undefined)).toBeGreaterThan(0)
  })

  it('should handle 0 seed and return 1 (to guarantee positive)', () => {
    expect(toRpcRequestId(0)).toBe(1)
  })

  it('should handle large safe integers', () => {
    const largeSeed = Number.MAX_SAFE_INTEGER
    expect(toRpcRequestId(largeSeed)).toBe(largeSeed)
  })

  it('should return 1 for negative zero', () => {
    expect(toRpcRequestId(-0)).toBe(1)
  })
})
