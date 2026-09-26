import { describe, expect, test } from 'vitest'
import { encodeDecodeResponse } from '../../workers/decoder/encodeDecodeResponse'

describe('encodeDecodeResponse', () => {
  test('encodes successful response with data and omits error', () => {
    // Even if error is passed, it should be omitted when ok: true
    const input = { ok: true, data: { foo: 'bar' }, error: 'ignored' }
    const result = JSON.parse(encodeDecodeResponse(input))
    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ foo: 'bar' })
    expect(result.error).toBeUndefined()
  })

  test('encodes failed response with normalized error and omits data', () => {
    // Data should be omitted when ok: false
    const input = { ok: false, data: { junk: 123 }, error: 'critical failure' }
    const result = JSON.parse(encodeDecodeResponse(input))
    expect(result.ok).toBe(false)
    expect(result.data).toBeUndefined()
    expect(result.error).toEqual({
      code: 'UNKNOWN',
      message: 'critical failure',
      retryable: false,
    })
  })

  test('handles missing data in successful response gracefully', () => {
    const input = { ok: true }
    const result = JSON.parse(encodeDecodeResponse(input))
    expect(result.ok).toBe(true)
    expect(result.data).toBeUndefined()
  })

  test('handles blank error in failed response with normalization fallback', () => {
    const input = { ok: false }
    const result = JSON.parse(encodeDecodeResponse(input))
    expect(result.ok).toBe(false)
    expect(result.error).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown Error',
      retryable: false,
    })
  })

  test('correctly normalizes Error objects in failed responses', () => {
    const err = new Error('thrown error')
    // @ts-ignore - Error object does not have a code property
    err.code = 'E123'
    const input = { ok: false, error: err }
    const result = JSON.parse(encodeDecodeResponse(input))
    expect(result.ok).toBe(false)
    expect(result.error).toEqual({
      code: 'E123',
      message: 'thrown error',
      retryable: false,
    })
  })

  describe('unknown fields', () => {
    test('should ignore unknown fields in successful response', () => {
      const input = {
        ok: true,
        data: { foo: 'bar' },
        unknownField: 'should be ignored',
        anotherUnknown: 123,
      } as any
      const result = JSON.parse(encodeDecodeResponse(input))
      expect(result.ok).toBe(true)
      expect(result.data).toEqual({ foo: 'bar' })
      expect(result.unknownField).toBeUndefined()
      expect(result.anotherUnknown).toBeUndefined()
    })

    test('should ignore unknown fields in failed response', () => {
      const input = {
        ok: false,
        error: 'critical failure',
        unknownField: 'should be ignored',
        anotherUnknown: 123,
      } as any
      const result = JSON.parse(encodeDecodeResponse(input))
      expect(result.ok).toBe(false)
      expect(result.error).toEqual({
        code: 'UNKNOWN',
        message: 'critical failure',
        retryable: false,
      })
      expect(result.unknownField).toBeUndefined()
      expect(result.anotherUnknown).toBeUndefined()
    })

    test('should ignore unknown fields in data object of successful response', () => {
      const input = {
        ok: true,
        data: {
          foo: 'bar',
          unknownField: 'should be ignored',
          anotherUnknown: 123,
        },
      } as any
      const result = JSON.parse(encodeDecodeResponse(input))
      expect(result.ok).toBe(true)
      // The codec doesn't filter unknown fields within data objects
      // It only filters at the top level of the response envelope
      expect(result.data).toEqual({
        foo: 'bar',
        unknownField: 'should be ignored',
        anotherUnknown: 123,
      })
    })
  })

  describe('missing required fields', () => {
    test('should handle missing ok field gracefully', () => {
      const input = {} as any
      const result = JSON.parse(encodeDecodeResponse(input))
      // When ok is falsy/missing, it treats as failed response
      expect(result.ok).toBe(false)
      expect(result.error).toEqual({
        code: 'UNKNOWN',
        message: 'Unknown Error',
        retryable: false,
      })
    })

    test('should handle missing data in successful response', () => {
      const input = { ok: true } as any
      const result = JSON.parse(encodeDecodeResponse(input))
      expect(result.ok).toBe(true)
      expect(result.data).toBeUndefined()
    })

    test('should handle missing error in failed response', () => {
      const input = { ok: false } as any
      const result = JSON.parse(encodeDecodeResponse(input))
      expect(result.ok).toBe(false)
      expect(result.error).toEqual({
        code: 'UNKNOWN',
        message: 'Unknown Error',
        retryable: false,
      })
    })
  })
})
