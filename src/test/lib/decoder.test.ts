import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Comlink from 'comlink'
import { decodeScVal } from '../../lib/decoder'

vi.mock('comlink', () => ({
  wrap: vi.fn(),
}))

describe('decodeScVal helper', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('should return normalized node when worker succeeds', async () => {
    const mockNode: any = { kind: 'primitive', scType: 'bool', value: true }
    const mockWorker = {
      decodeScVal: vi.fn().mockResolvedValue(mockNode),
      terminate: vi.fn(),
    }
    vi.mocked(Comlink.wrap).mockReturnValue(mockWorker as any)
    vi.mocked(globalThis.Worker).mockImplementation(function () {
      return mockWorker as any
    })

    const result = await decodeScVal('encoded-xdr')

    expect(result).toEqual(mockNode)
    expect(mockWorker.decodeScVal).toHaveBeenCalledWith({ xdr: 'encoded-xdr' })
    expect(mockWorker.terminate).toHaveBeenCalledOnce()
  })

  it('should throw error when worker returns DecoderWorkerError', async () => {
    const mockError: any = {
      code: 'DECODE_FAILED',
      message: 'Something went wrong',
    }
    const mockWorker = {
      decodeScVal: vi.fn().mockResolvedValue(mockError),
      terminate: vi.fn(),
    }
    vi.mocked(Comlink.wrap).mockReturnValue(mockWorker as any)
    vi.mocked(globalThis.Worker).mockImplementation(function () {
      return mockWorker as any
    })

    await expect(decodeScVal('encoded-xdr')).rejects.toThrow(
      'Something went wrong',
    )
    expect(mockWorker.terminate).toHaveBeenCalledOnce()
  })

  it('should throw unexpected error when worker communication fails', async () => {
    const mockWorker = {
      decodeScVal: vi.fn().mockRejectedValue(new Error('Network failure')),
      terminate: vi.fn(),
    }
    vi.mocked(Comlink.wrap).mockReturnValue(mockWorker as any)
    vi.mocked(globalThis.Worker).mockImplementation(function () {
      return mockWorker as any
    })

    await expect(decodeScVal('encoded-xdr')).rejects.toThrow('Network failure')
    expect(mockWorker.terminate).toHaveBeenCalledOnce()
  })
})
