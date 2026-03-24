import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { withWorkerPingTimeout } from '../../workers/withWorkerPingTimeout'

describe('withWorkerPingTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should resolve with "pong" if the worker responds within the timeout', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
    }

    const promise = withWorkerPingTimeout(mockWorker, 5000)
    
    // Fast-forward time not needed here because it should resolve immediately or within the ping promise
    const result = await promise

    expect(result).toBe('pong')
    expect(mockWorker.ping).toHaveBeenCalledOnce()
  })

  it('should reject with a timeout error if the worker does not respond in time', async () => {
    const mockWorker = {
      ping: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
    }

    const promise = withWorkerPingTimeout(mockWorker, 5000)

    // Advance timers to trigger the timeout
    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toThrow('Worker ping timed out after 5000ms')
  })

  it('should reject if the worker.ping rejects', async () => {
    const mockWorker = {
      ping: vi.fn().mockRejectedValue(new Error('Internal worker error')),
    }

    const promise = withWorkerPingTimeout(mockWorker, 5000)

    await expect(promise).rejects.toThrow('Internal worker error')
  })

  it('should normalize invalid timeout values using normalizeTimeoutMs semantics', async () => {
    const mockWorker = {
      ping: vi.fn().mockReturnValue(new Promise(() => {})),
    }

    // Pass an invalid timeout (e.g., -100) which should fallback to 10000ms (as per normalizeTimeoutMs default fallback)
    const promise = withWorkerPingTimeout(mockWorker, -100)

    // Advance timers by less than 10000ms
    vi.advanceTimersByTime(5000)
    
    // It should still be pending
    // To check if it's pending, we can't easily wait, so we'll just advance to 10000
    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toThrow('Worker ping timed out after 10000ms')
  })

  it('should handle string timeout values (e.g., "3000")', async () => {
    const mockWorker = {
      ping: vi.fn().mockReturnValue(new Promise(() => {})),
    }

    // Pass string timeout which will be normalized to 3000
    const promise = withWorkerPingTimeout(mockWorker, '3000' as any)

    vi.advanceTimersByTime(3000)

    await expect(promise).rejects.toThrow('Worker ping timed out after 3000ms')
  })
})
