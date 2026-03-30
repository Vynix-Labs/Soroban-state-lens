import { describe, expect, it, vi } from 'vitest'
import { decodeScVal } from '../../lib/decoder'
import { createDecoderWorker } from '../../workers/createDecoderWorker'

// Mock the worker factory
vi.mock('../../workers/createDecoderWorker', () => ({
  createDecoderWorker: vi.fn(),
}))

describe('decodeScVal helper', () => {
  it('should return normalized node when worker succeeds', async () => {
    // Arrange
    const mockNode: any = { kind: 'primitive', scType: 'bool', value: true }
    const mockWorker = {
      decodeScVal: vi.fn().mockResolvedValue(mockNode),
    }
    vi.mocked(createDecoderWorker).mockReturnValue(mockWorker as any)

    // Act
    const result = await decodeScVal('encoded-xdr')

    // Assert
    expect(result).toEqual(mockNode)
    expect(mockWorker.decodeScVal).toHaveBeenCalledWith({ xdr: 'encoded-xdr' })
  })

  it('should throw error when worker returns DecoderWorkerError', async () => {
    // Arrange
    const mockError: any = {
      code: 'DECODE_FAILED',
      message: 'Something went wrong',
    }
    const mockWorker = {
      decodeScVal: vi.fn().mockResolvedValue(mockError),
    }
    vi.mocked(createDecoderWorker).mockReturnValue(mockWorker as any)

    // Act & Assert
    await expect(decodeScVal('encoded-xdr')).rejects.toThrow(
      'Something went wrong',
    )
  })

  it('should throw unexpected error when worker communication fails', async () => {
    // Arrange
    const mockWorker = {
      decodeScVal: vi.fn().mockRejectedValue(new Error('Network failure')),
    }
    vi.mocked(createDecoderWorker).mockReturnValue(mockWorker as any)

    // Act & Assert
    await expect(decodeScVal('encoded-xdr')).rejects.toThrow('Network failure')
  })
})
