import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AbortError,
  getLedgerEntries,
} from '../../lib/network/getLedgerEntries'

import type { GetLedgerEntriesParams } from '../../lib/network/getLedgerEntries'
import type * as StellarSDK from '@stellar/stellar-sdk'

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof StellarSDK>()
  return {
    ...actual,
    xdr: {
      LedgerKey: {
        fromXDR: vi.fn((key: string) => ({
          toXDR: () => key,
        })),
      },
    },
    rpc: {
      Server: vi.fn(),
    },
  }
})

describe('getLedgerEntries', () => {
  const mockRpcUrl = 'https://test.rpc.url'
  const mockKeys = ['key1', 'key2']
  let mockGetLedgerEntries: ReturnType<typeof vi.fn>
  let rpc: typeof StellarSDK.rpc

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetLedgerEntries = vi.fn()

    const sdk = await import('@stellar/stellar-sdk')
    rpc = sdk.rpc
    vi.mocked(rpc.Server).mockImplementation(function (this: any) {
      this.getLedgerEntries = mockGetLedgerEntries
      return this
    })
  })

  describe('success scenarios', () => {
    it('fetches ledger entries successfully', async () => {
      const mockResponse = {
        entries: [
          {
            key: { toXDR: () => 'key1' },
            val: { toXDR: () => 'xdr1' },
            lastModifiedLedgerSeq: 100,
            liveUntilLedgerSeq: 200,
          },
          {
            key: { toXDR: () => 'key2' },
            val: { toXDR: () => 'xdr2' },
            lastModifiedLedgerSeq: 101,
            liveUntilLedgerSeq: 201,
          },
        ],
        latestLedger: 150,
      }

      mockGetLedgerEntries.mockResolvedValue(mockResponse)

      const params: GetLedgerEntriesParams = {
        rpcUrl: mockRpcUrl,
        keys: mockKeys,
      }

      const result = await getLedgerEntries(params)

      expect(rpc.Server).toHaveBeenCalledWith(mockRpcUrl)
      expect(mockGetLedgerEntries).toHaveBeenCalled()
      expect(result).toEqual({
        entries: [
          {
            key: 'key1',
            xdr: 'xdr1',
            lastModifiedLedgerSeq: 100,
            liveUntilLedgerSeq: 200,
          },
          {
            key: 'key2',
            xdr: 'xdr2',
            lastModifiedLedgerSeq: 101,
            liveUntilLedgerSeq: 201,
          },
        ],
        latestLedger: 150,
      })
    })

    it('handles empty key list', async () => {
      const mockResponse = {
        entries: [],
        latestLedger: 100,
      }

      mockGetLedgerEntries.mockResolvedValue(mockResponse)

      const result = await getLedgerEntries({
        rpcUrl: mockRpcUrl,
        keys: [],
      })

      expect(result.entries).toEqual([])
      expect(result.latestLedger).toBe(100)
    })
  })

  describe('failure scenarios', () => {
    it('throws network error on RPC failure', async () => {
      const networkError = new Error('Network failure')
      mockGetLedgerEntries.mockRejectedValue(networkError)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('Network failure')
    })

    it('throws error on invalid RPC response', async () => {
      mockGetLedgerEntries.mockRejectedValue(new Error('Invalid response'))

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('Invalid response')
    })
  })

  describe('abort scenarios', () => {
    it('throws AbortError when signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
          signal: controller.signal,
        }),
      ).rejects.toThrow(AbortError)

      expect(mockGetLedgerEntries).not.toHaveBeenCalled()
    })

    it('throws AbortError when aborted during request', async () => {
      const controller = new AbortController()

      mockGetLedgerEntries.mockImplementation(() => {
        controller.abort()
        return Promise.resolve({
          entries: [],
          latestLedger: 100,
        })
      })

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
          signal: controller.signal,
        }),
      ).rejects.toThrow(AbortError)
    })

    it('does not emit stale results after abort', async () => {
      const controller = new AbortController()
      let resolveRequest: (value: unknown) => void

      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve
      })

      mockGetLedgerEntries.mockReturnValue(requestPromise)

      const fetchPromise = getLedgerEntries({
        rpcUrl: mockRpcUrl,
        keys: mockKeys,
        signal: controller.signal,
      })

      controller.abort()

      resolveRequest!({
        entries: [{ key: 'stale', xdr: 'stale' }],
        latestLedger: 100,
      })

      await expect(fetchPromise).rejects.toThrow(AbortError)
    })

    it('normalizes abort errors from underlying layer', async () => {
      const controller = new AbortController()
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      mockGetLedgerEntries.mockRejectedValue(abortError)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
          signal: controller.signal,
        }),
      ).rejects.toThrow(AbortError)
    })

    it('allows successful completion without signal', async () => {
      const mockResponse = {
        entries: [
          {
            key: { toXDR: () => 'key1' },
            val: { toXDR: () => 'xdr1' },
          },
        ],
        latestLedger: 100,
      }

      mockGetLedgerEntries.mockResolvedValue(mockResponse)

      const result = await getLedgerEntries({
        rpcUrl: mockRpcUrl,
        keys: mockKeys,
      })

      expect(result.entries).toHaveLength(1)
    })
  })
})
