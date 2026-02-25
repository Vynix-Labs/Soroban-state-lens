// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizeRpcError } from '../../lib/rpc/normalizeRpcError'

describe('normalizeRpcError', () => {
  it('should normalize a standard Error object', () => {
    const err = new Error('Something went wrong')
    const result = normalizeRpcError(err)
    expect(result).toEqual({
      code: 'UNKNOWN',
      message: 'Something went wrong',
      retryable: false,
    })
  })

  it('should normalize an Error object with code and retryable flag', () => {
    const err = new Error('Rate limit exceeded')
    ;(err as any).code = 'RATE_LIMIT'
    ;(err as any).retryable = true
    const result = normalizeRpcError(err)
    expect(result).toEqual({
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      retryable: true,
    })
  })

  it('should normalize a string input', () => {
    const result = normalizeRpcError('Direct error string')
    expect(result).toEqual({
      code: 'UNKNOWN',
      message: 'Direct error string',
      retryable: false,
    })
  })

  it('should normalize a JSON-RPC error response', () => {
    const rpcError = {
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    }
    const result = normalizeRpcError(rpcError)
    expect(result).toEqual({
      code: '-32601',
      message: 'Method not found',
      retryable: false,
    })
  })

  it('should set retryable=true for JSON-RPC internal error (-32603)', () => {
    const rpcError = {
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32603,
        message: 'Internal error',
      },
    }
    const result = normalizeRpcError(rpcError)
    expect(result.retryable).toBe(true)
  })

  it('should set retryable=true for JSON-RPC server error range (-32000 to -32099)', () => {
    const rpcError = {
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32005,
        message: 'Server error',
      },
    }
    const result = normalizeRpcError(rpcError)
    expect(result.retryable).toBe(true)
  })

  it('should handle object with message and code', () => {
    const input = { message: 'Custom message', code: 500, retryable: true }
    const result = normalizeRpcError(input)
    expect(result).toEqual({
      code: '500',
      message: 'Custom message',
      retryable: true,
    })
  })

  it('should provide defaults for empty or invalid inputs', () => {
    expect(normalizeRpcError(null)).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown Error',
      retryable: false,
    })
    expect(normalizeRpcError(undefined)).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown Error',
      retryable: false,
    })
    expect(normalizeRpcError({})).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown Error',
      retryable: false,
    })
    expect(normalizeRpcError('')).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown Error',
      retryable: false,
    })
  })

  it('should handles numeric code in Error object', () => {
    const err = new Error('Failure')
    ;(err as any).code = 404
    const result = normalizeRpcError(err)
    expect(result.code).toBe('404')
  })
})
