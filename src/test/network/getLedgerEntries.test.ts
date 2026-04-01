import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AbortError,
  getLedgerEntries,
} from '../../lib/network/getLedgerEntries'

import type { GetLedgerEntriesParams } from '../../lib/network/getLedgerEntries'

describe('getLedgerEntries', () => {
  const mockRpcUrl = 'https://test.rpc.url'
  const mockKeys = ['key1', 'key2']

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('success scenarios', () => {
    it('fetches ledger entries successfully', async () => {
      const mockRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
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
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRpcResponse,
      } as Response)

      const params: GetLedgerEntriesParams = {
        rpcUrl: mockRpcUrl,
        keys: mockKeys,
      }

      const result = await getLedgerEntries(params)

      expect(fetch).toHaveBeenCalledWith(
        mockRpcUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"method":"getLedgerEntries"'),
        }),
      )

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

    it('handles empty entries array from RPC', async () => {
      const mockRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          entries: null,
          latestLedger: 100,
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRpcResponse,
      } as Response)

      const result = await getLedgerEntries({
        rpcUrl: mockRpcUrl,
        keys: [],
      })

      expect(result.entries).toEqual([])
      expect(result.latestLedger).toBe(100)
    })
  })

  describe('failure scenarios', () => {
    it('throws error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network failure'))

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('Network failure')
    })

    it('throws error on non-OK HTTP status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('HTTP error! status: 500')
    })

    it('throws error on RPC error response', async () => {
      const errorResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => errorResponse,
      } as Response)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('RPC Error (-32600): Invalid Request')
    })

    it('throws error on invalid JSON-RPC format', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
        }),
      ).rejects.toThrow('Invalid JSON-RPC response format')
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

      expect(fetch).not.toHaveBeenCalled()
    })

    it('throws AbortError when aborted during fetch', async () => {
      const controller = new AbortController()
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'

      vi.mocked(fetch).mockRejectedValue(abortError)

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
          signal: controller.signal,
        }),
      ).rejects.toThrow(AbortError)
    })

    it('throws AbortError if signal is aborted after fetch completes but before result return', async () => {
      const controller = new AbortController()
      
      vi.mocked(fetch).mockImplementation(async () => {
        controller.abort()
        return {
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: { entries: [], latestLedger: 100 },
          }),
        } as Response
      })

      await expect(
        getLedgerEntries({
          rpcUrl: mockRpcUrl,
          keys: mockKeys,
          signal: controller.signal,
        }),
      ).rejects.toThrow(AbortError)
    })
  })
})

