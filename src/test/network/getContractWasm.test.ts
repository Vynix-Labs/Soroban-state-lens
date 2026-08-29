import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as rpcClient from '../../lib/network/rpcClient'
import { getContractWasm } from '../../lib/network/getContractWasm'
import type { GetContractWasmParams } from '../../lib/network/getContractWasm'

describe('getContractWasm', () => {
  const mockRpcUrl = 'https://test.rpc.url'
  const mockContractId = 'C'.repeat(56)

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('uses the provided timeout while defaulting to 10 seconds', async () => {
    const callRpcSpy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { code: 'AQIDBA==' },
    })

    await getContractWasm({
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
      timeout: 2500,
    })

    expect(callRpcSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: mockRpcUrl,
        timeout: 2500,
        signal: undefined,
      }),
      expect.anything(),
    )

    callRpcSpy.mockClear()
    await getContractWasm({
      rpcUrl: mockRpcUrl,
      contractId: mockContractId,
    })

    expect(callRpcSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: mockRpcUrl,
        timeout: 10000,
      }),
      expect.anything(),
    )
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
})
