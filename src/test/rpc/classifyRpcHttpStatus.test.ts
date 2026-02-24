import { describe, expect, it } from 'vitest'
import { classifyRpcHttpStatus } from '../../lib/rpc/classifyRpcHttpStatus'

describe('classifyRpcHttpStatus', () => {
  it('should return "retryable" for status 429', () => {
    expect(classifyRpcHttpStatus(429)).toBe('retryable')
  })

  it('should return "retryable" for 5xx status codes', () => {
    expect(classifyRpcHttpStatus(500)).toBe('retryable')
    expect(classifyRpcHttpStatus(503)).toBe('retryable')
    expect(classifyRpcHttpStatus(504)).toBe('retryable')
    expect(classifyRpcHttpStatus(599)).toBe('retryable')
  })

  it('should return "fatal" for 4xx status codes except 429', () => {
    expect(classifyRpcHttpStatus(400)).toBe('fatal')
    expect(classifyRpcHttpStatus(401)).toBe('fatal')
    expect(classifyRpcHttpStatus(403)).toBe('fatal')
    expect(classifyRpcHttpStatus(404)).toBe('fatal')
    expect(classifyRpcHttpStatus(499)).toBe('fatal')
  })

  it('should return "unknown" for 2xx and 3xx status codes', () => {
    expect(classifyRpcHttpStatus(200)).toBe('unknown')
    expect(classifyRpcHttpStatus(201)).toBe('unknown')
    expect(classifyRpcHttpStatus(301)).toBe('unknown')
    expect(classifyRpcHttpStatus(302)).toBe('unknown')
  })

  it('should return "unknown" for non-integer values', () => {
    expect(classifyRpcHttpStatus(429.5)).toBe('unknown')
    expect(classifyRpcHttpStatus(500.1)).toBe('unknown')
    expect(classifyRpcHttpStatus(NaN)).toBe('unknown')
    expect(classifyRpcHttpStatus(Infinity)).toBe('unknown')
  })

  it('should return "unknown" for negative values', () => {
    expect(classifyRpcHttpStatus(-1)).toBe('unknown')
    expect(classifyRpcHttpStatus(-500)).toBe('unknown')
  })

  it('should return "unknown" for zero', () => {
    expect(classifyRpcHttpStatus(0)).toBe('unknown')
  })
})
