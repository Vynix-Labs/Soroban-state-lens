import { describe, expect, it, vi } from 'vitest'
import { withWorkerPingTimeout } from '../../workers/withWorkerPingTimeout'

describe('withWorkerPingTimeout', () => {
  it('should resolve with "pong" if the worker responds with valid pong status', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
    }

    const result = await withWorkerPingTimeout(mockWorker, 5000)

    expect(result).toBe('pong')
    expect(mockWorker.ping).toHaveBeenCalledOnce()
  })

  it('should reject if the worker.ping rejects', async () => {
    const mockWorker = {
      ping: vi.fn().mockRejectedValue(new Error('Internal worker error')),
    }

    await expect(withWorkerPingTimeout(mockWorker, 5000)).rejects.toThrow(
      'Internal worker error',
    )
  })

  it('should reject if worker ping returns null', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue(null),
    }

    await expect(withWorkerPingTimeout(mockWorker, 5000)).rejects.toThrow(
      'Worker ping returned malformed response',
    )
  })

  it('should reject if worker ping returns wrong status', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue({ status: 'error' }),
    }

    await expect(withWorkerPingTimeout(mockWorker, 5000)).rejects.toThrow(
      'Worker ping returned malformed response',
    )
  })

  it('should reject if worker ping returns object without status', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue({ message: 'hello' }),
    }

    await expect(withWorkerPingTimeout(mockWorker, 5000)).rejects.toThrow(
      'Worker ping returned malformed response',
    )
  })

  it('should reject if worker ping returns non-object value', async () => {
    const mockWorker = {
      ping: vi.fn().mockResolvedValue('pong'),
    }

    await expect(withWorkerPingTimeout(mockWorker, 5000)).rejects.toThrow(
      'Worker ping returned malformed response',
    )
  })
})
