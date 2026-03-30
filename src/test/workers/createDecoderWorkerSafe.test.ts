import { describe, expect, test, vi } from 'vitest'
import { createDecoderWorkerSafe } from '../../workers/createDecoderWorkerSafe'
import * as originalFactory from '../../workers/createDecoderWorker'

describe('createDecoderWorkerSafe', () => {
  test('returns a promise that resolves successfully on happy path', async () => {
    // Mock the original factory as specified in Issue #102 since Worker is not available in node.
    const spy = vi
      .spyOn(originalFactory, 'createDecoderWorker')
      .mockImplementation(() => {
        // Return a simple object matching the required structure for the test
        return {
          ping: vi.fn(),
        } as any
      })

    // We expect it to resolve to a Comlink proxy which is defined
    const workerPromise = createDecoderWorkerSafe()
    await expect(workerPromise).resolves.toBeDefined()
    const worker = await workerPromise
    // Proxies in Comlink are objects with methods from the target API
    expect(worker).toBeTruthy()
    expect(typeof worker.ping).toBe('function')

    spy.mockRestore()
  })

  test('returns a rejected promise with stable message on constructor failures', async () => {
    // Mock the original factory to simulate a synchronous constructor failure
    const spy = vi
      .spyOn(originalFactory, 'createDecoderWorker')
      .mockImplementation(() => {
        throw new Error('Worker constructor failed')
      })

    const workerPromise = createDecoderWorkerSafe()

    // Should normalize the error message as specified in Issue #102
    await expect(workerPromise).rejects.toThrow(
      'Failed to initialize decoder worker: Worker constructor failed',
    )

    spy.mockRestore()
  })

  test('normalizes non-Error type throws into stable message', async () => {
    // Mock the original factory to throw a direct string
    const spy = vi
      .spyOn(originalFactory, 'createDecoderWorker')
      .mockImplementation(() => {
        throw 'Direct string error'
      })

    const workerPromise = createDecoderWorkerSafe()

    await expect(workerPromise).rejects.toThrow(
      'Failed to initialize decoder worker: Direct string error',
    )

    spy.mockRestore()
  })
})
