import { describe, expect, it, vi } from 'vitest'
import { withRpcRetries } from '../../lib/rpc/withRpcRetries'

describe('withRpcRetries', () => {
  it('should return result if operation succeeds immediately', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRpcRetries(fn)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry a retryable thrown error and succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 'TIMEOUT', message: 'timeout' })
      .mockResolvedValueOnce('success')

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should surface the final failure clearly when retries are exhausted (thrown error)', async () => {
    const errorObj = { code: 'NETWORK_ERROR', message: 'Fail' }
    const fn = vi.fn().mockRejectedValue(errorObj)

    await expect(
      withRpcRetries(fn, { maxAttempts: 3, baseDelayMs: 1, jitterRatio: 0 })
    ).rejects.toEqual(errorObj)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should fail immediately on a non-retryable failure (thrown error)', async () => {
    const errorObj = { code: 400, message: 'Bad request' }
    const fn = vi.fn().mockRejectedValue(errorObj)

    await expect(
      withRpcRetries(fn, { maxAttempts: 3, baseDelayMs: 1, jitterRatio: 0 })
    ).rejects.toEqual(errorObj)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry a retryable returned JSON-RPC error response', async () => {
    const rpcError = {
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32603, message: 'Internal error' },
    }
    const fn = vi.fn()
      .mockResolvedValueOnce(rpcError)
      .mockResolvedValueOnce('success')

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should return the final JSON-RPC error if retries are exhausted', async () => {
    const rpcError = {
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32603, message: 'Internal error' },
    }
    const fn = vi.fn().mockResolvedValue(rpcError)

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toEqual(rpcError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should retry a retryable returned Network RpcError (e.g. 429)', async () => {
    const networkError = { message: 'HTTP 429', code: 429, isTimeout: false }
    const fn = vi.fn()
      .mockResolvedValueOnce(networkError)
      .mockResolvedValueOnce('success')

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry a non-retryable returned Network RpcError (e.g. 400)', async () => {
    const networkError = { message: 'HTTP 400', code: 400, isTimeout: false }
    const fn = vi.fn().mockResolvedValue(networkError)

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toEqual(networkError)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should treat Network Timeout RpcError as retryable', async () => {
    const networkError = { message: 'Timeout', code: 'TIMEOUT', isTimeout: true }
    const fn = vi.fn()
      .mockResolvedValueOnce(networkError)
      .mockResolvedValueOnce('success')

    const result = await withRpcRetries(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      jitterRatio: 0,
    })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
