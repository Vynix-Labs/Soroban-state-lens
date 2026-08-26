import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getContractWasm } from '../../lib/network/getContractWasm'
import type { GetContractWasmParams } from '../../lib/network/getContractWasm'
import * as rpcClient from '../../lib/network/rpcClient'

// Hoist before imports: pin toRpcRequestId to 1 so fetch-level mocks can use id: 1
vi.mock('../../lib/rpc/toRpcRequestId', () => ({
  toRpcRequestId: vi.fn(() => 1),
}))

describe('getContractWasm', () => {
  const mockRpcUrl = 'https://test.rpc.url'
  const mockContractId = 'C'.repeat(56)

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns WASM bytes when contract code is available', async () => {
    const mockRpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        code: 'AQIDBA==',
      },
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockRpcResponse,
    } as Response)

    const params: GetContractWasmParams = {
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
    }

    const result = await getContractWasm(params)

    expect(result).toEqual({
      success: true,
      wasm: new Uint8Array([1, 2, 3, 4]),
    })
  })

  it('returns a failure result when the RPC request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await getContractWasm({
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
    })

    expect(result).toEqual({
      success: false,
      error: 'Network error',
    })
  })

  it('returns a failure result when the caller signal aborts', async () => {
    const controller = new AbortController()
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.reject(
        new DOMException('The operation was aborted.', 'AbortError'),
      ),
    )

    controller.abort()
    const result = await getContractWasm({
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
      signal: controller.signal,
    })

    expect(result).toEqual({
      success: false,
      error: 'Request aborted',
    })
  })

  it('returns a failure result when the response id does not match the request id', async () => {
    // Spy on callRpc to return a well-formed success response whose id
    // is intentionally offset from the request id, verifying that
    // the adapter rejects the ID mismatch.
    vi.spyOn(rpcClient, 'callRpc').mockImplementation(async (_config, body) => {
      const requestId = (body as { id?: number })?.id
      return {
        jsonrpc: '2.0',
        id: (requestId ?? 0) + 1000,
        result: { code: 'AQIDBA==' },
      }
    })

    const result = await getContractWasm({
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
    })

    expect(result).toEqual({
      success: false,
      error: 'Invalid response from RPC server',
    })
  })
})
