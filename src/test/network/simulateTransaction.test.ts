import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  simulateTransaction,
  simulateTransactionAdapter,
} from '../../lib/network/simulateTransaction'
import { extractFootprintKeys } from '../../lib/network/footprint'

describe('simulateTransactionAdapter', () => {
  it('should return success false when response is null', () => {
    const result = simulateTransactionAdapter(null)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No response provided')
  })

  it('should return success false when response is undefined', () => {
    const result = simulateTransactionAdapter(undefined)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No response provided')
  })

  it('should return success false when response has error', () => {
    const result = simulateTransactionAdapter({ error: 'Transaction failed' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Transaction failed')
  })

  it('should return typed response shape on success', () => {
    const response = {
      latestLedger: 100,
      results: [{ xdr: 'some-xdr', auth: [] }],
      footprint: {
        readOnly: ['key1', 'key2'],
        readWrite: ['key3'],
      },
    }
    const result = simulateTransactionAdapter(response)
    expect(result.success).toBe(true)
    expect(result.latestLedger).toBe(100)
    expect(result.results).toHaveLength(1)
    expect(result.footprint?.readOnly).toEqual(['key1', 'key2'])
    expect(result.footprint?.readWrite).toEqual(['key3'])
  })

  it('should handle missing footprint safely', () => {
    const result = simulateTransactionAdapter({ latestLedger: 50 })
    expect(result.success).toBe(true)
    expect(result.footprint?.readOnly).toEqual([])
    expect(result.footprint?.readWrite).toEqual([])
  })

  it('should handle empty results safely', () => {
    const result = simulateTransactionAdapter({ latestLedger: 50, results: [] })
    expect(result.success).toBe(true)
    expect(result.results).toEqual([])
  })
})

describe('extractFootprintKeys', () => {
  it('should return empty arrays when footprint is null', () => {
    const result = extractFootprintKeys(null)
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should return empty arrays when footprint is undefined', () => {
    const result = extractFootprintKeys(undefined)
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should return empty arrays when footprint is empty', () => {
    const result = extractFootprintKeys({})
    expect(result.readOnly).toEqual([])
    expect(result.readWrite).toEqual([])
  })

  it('should deduplicate readOnly keys', () => {
    const result = extractFootprintKeys({
      readOnly: ['key1', 'key2', 'key1', 'key3', 'key2'],
    })
    expect(result.readOnly).toEqual(['key1', 'key2', 'key3'])
  })

  it('should deduplicate readWrite keys', () => {
    const result = extractFootprintKeys({
      readWrite: ['keyA', 'keyB', 'keyA'],
    })
    expect(result.readWrite).toEqual(['keyA', 'keyB'])
  })

  it('should return stable sorted ordering', () => {
    const result = extractFootprintKeys({
      readOnly: ['zzz', 'aaa', 'mmm'],
      readWrite: ['ccc', 'aaa'],
    })
    expect(result.readOnly).toEqual(['aaa', 'mmm', 'zzz'])
    expect(result.readWrite).toEqual(['aaa', 'ccc'])
  })

  it('should handle missing readOnly or readWrite safely', () => {
    const result1 = extractFootprintKeys({ readOnly: ['key1'] })
    expect(result1.readOnly).toEqual(['key1'])
    expect(result1.readWrite).toEqual([])

    const result2 = extractFootprintKeys({ readWrite: ['key1'] })
    expect(result2.readOnly).toEqual([])
    expect(result2.readWrite).toEqual(['key1'])
  })
})

describe('simulateTransaction request helper', () => {
  const mockRpcUrl = 'https://test.rpc.url'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns a parsed success response', async () => {
    const rpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        latestLedger: 100,
        results: [{ xdr: 'some-xdr', auth: [] }],
        footprint: {
          readOnly: ['key1'],
          readWrite: ['key2'],
        },
      },
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => rpcResponse,
    } as Response)

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(true)
    expect(result.latestLedger).toBe(100)
    expect(result.results).toHaveLength(1)
    expect(result.footprint?.readOnly).toEqual(['key1'])
    expect(result.footprint?.readWrite).toEqual(['key2'])
    expect(fetch).toHaveBeenCalledWith(
      mockRpcUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('returns a handled error on JSON-RPC error', async () => {
    const rpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32602, message: 'Invalid params' },
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => rpcResponse,
    } as Response)

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('RPC Error')
  })

  it('returns a handled error on HTTP failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('HTTP 500')
  })

  it('returns a handled error on malformed JSON-RPC', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ not: 'rpc' }),
    } as Response)

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid JSON-RPC')
  })

  it('returns a handled error when the transaction XDR is empty', async () => {
    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('required')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns a handled abort error when the caller signal is aborted', async () => {
    vi.mocked(fetch).mockRejectedValue(
      new DOMException('The operation was aborted.', 'AbortError'),
    )

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Request aborted')
  })

  it('returns a handled error on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await simulateTransaction({
      rpcUrl: mockRpcUrl,
      transaction: 'base64-xdr',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to fetch')
  })
})
