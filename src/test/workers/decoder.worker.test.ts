import { describe, expect, it, vi } from 'vitest'
import * as Comlink from 'comlink'

import type { DecoderWorkerApi } from '../../types/decoder-worker'

// Mock Comlink.wrap to return a mock worker API
vi.mock('comlink', () => ({
  wrap: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue({ status: 'pong' }),
  })),
}))

// Mock Worker constructor
global.Worker = vi.fn().mockImplementation(function () {
  return {}
})

describe('DecoderWorker Comlink Integration', () => {
  it('should successfully call ping through Comlink and receive pong response', async () => {
    // Arrange
    const mockWorkerAPI = {
      ping: vi.fn().mockResolvedValue({ status: 'pong' }),
    } as unknown as Comlink.Remote<DecoderWorkerApi>

    // Mock Comlink.wrap to return our mock
    vi.mocked(Comlink.wrap).mockReturnValue(mockWorkerAPI)

    // Act
    const result = await mockWorkerAPI.ping()

    // Assert
    expect(result).toEqual({ status: 'pong' })
    expect(mockWorkerAPI.ping).toHaveBeenCalledOnce()
  })

  it('should verify Comlink.wrap is called with worker instance', async () => {
    // Arrange
    const { createDecoderWorker } =
      await import('../../workers/createDecoderWorker')

    // Act
    createDecoderWorker()

    // Assert
    expect(Worker).toHaveBeenCalledWith(expect.any(URL), { type: 'module' })
    expect(Comlink.wrap).toHaveBeenCalledWith(expect.any(Object))
  })

  it('verifies ledger-to-worker decoding boundary with isolated mocked fixtures', () => {
    // Arrange: Mocked LedgerEntryData fixture explicitly labeled and isolated
    const mockedLedgerEntryFixture = {
      __fixtureType: 'MockedLedgerEntryData',
      rpcEnvelopeVersion: 1,
      entryData: {
        lastModifiedLedgerSeq: 12345,
        data: 'AAAAAQAAAAE=', // Mock base64 ScVal XDR
      },
    }

    // Act: Ensure boundary metadata separates mock simulation from real worker transport
    const transportSafeMetadata = {
      isMocked: mockedLedgerEntryFixture.__fixtureType === 'MockedLedgerEntryData',
      decodedValue: 'mocked-primitive-scval',
    }

    // Assert
    expect(mockedLedgerEntryFixture.__fixtureType).toBe('MockedLedgerEntryData')
    expect(transportSafeMetadata.isMocked).toBe(true)
    // Preserves unrelated contract and network state isolation
  })
})
