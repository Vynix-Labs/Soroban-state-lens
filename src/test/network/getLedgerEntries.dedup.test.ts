import { describe, expect, it, vi } from 'vitest'
import { getLedgerEntries, AbortError } from '../../lib/network/getLedgerEntries'

describe('getLedgerEntries deduplication and RPC URL normalization', () => {
  const mockRpcUrl = 'https://test.rpc.url/'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('deduplicates returned entries and keeps first-seen', async () => {
    const mockRpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        entries: [
          { key: 'k1', xdr: 'a' },
          { key: 'k1', xdr: 'b' },
          { key: 'k2', xdr: 'c' },
        ],
        latestLedger: 5,
      },
    }

    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockRpcResponse } as Response)

    const res = await getLedgerEntries({ rpcUrl: mockRpcUrl, keys: [] })

    expect(res.latestLedger).toBe(5)
    expect(res.entries).toEqual([
      { key: 'k1', xdr: 'a', lastModifiedLedgerSeq: undefined, liveUntilLedgerSeq: undefined },
      { key: 'k2', xdr: 'c', lastModifiedLedgerSeq: undefined, liveUntilLedgerSeq: undefined },
    ])
  })

  it('throws AbortError when signal is aborted before call', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(getLedgerEntries({ rpcUrl: mockRpcUrl, keys: [], signal: controller.signal })).rejects.toThrow(AbortError)
  })
})
