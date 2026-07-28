import { describe, expect, it, vi } from 'vitest'
import { getLatestLedgerConnectionCheck } from '../../lib/network/getLatestLedger'
import * as rpcClient from '../../lib/network/rpcClient'

describe('getLatestLedgerConnectionCheck', () => {
  it('returns the latest ledger result for a reachable endpoint', async () => {
    const spy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 7,
      result: {
        id: 'abc123',
        protocolVersion: 23,
        sequence: 987654,
      },
    })

    const result = await getLatestLedgerConnectionCheck('https://valid-rpc.com')

    expect(result).toEqual({
      success: true,
      ledger: {
        id: 'abc123',
        protocolVersion: 23,
        sequence: 987654,
      },
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://valid-rpc.com', timeout: 5000 }),
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'getLatestLedger',
        params: {},
      }),
    )
  })

  it('allows specifying a custom timeout', async () => {
    const spy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 7,
      result: {
        id: 'abc123',
        protocolVersion: 23,
        sequence: 987654,
      },
    })

    const result = await getLatestLedgerConnectionCheck(
      'https://valid-rpc.com',
      1234,
    )

    expect(result).toEqual({
      success: true,
      ledger: {
        id: 'abc123',
        protocolVersion: 23,
        sequence: 987654,
      },
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://valid-rpc.com', timeout: 1234 }),
      expect.objectContaining({
        jsonrpc: '2.0',
        method: 'getLatestLedger',
        params: {},
      }),
    )
  })

  it('returns a handled failure when the endpoint is unreachable', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      message: 'Network error',
      code: 'NETWORK_ERROR',
    } as any)

    const result = await getLatestLedgerConnectionCheck(
      'https://invalid-rpc.com',
    )

    expect(result).toEqual({
      success: false,
      error: 'Network error',
    })
  })

  it('returns a handled failure for malformed success payloads', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: 23,
      },
    } as any)

    const result = await getLatestLedgerConnectionCheck('https://weird-rpc.com')

    expect(result).toEqual({
      success: false,
      error: 'Invalid response from RPC server',
    })
  })

  it.each([
    { sequence: -1 },
    { sequence: 1.5 },
    { sequence: Number.NaN },
    { sequence: Number.POSITIVE_INFINITY },
  ])('rejects invalid ledger sequence $sequence', async ({ sequence }) => {
    vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        sequence,
      },
    } as any)

    const result = await getLatestLedgerConnectionCheck('https://weird-rpc.com')

    expect(result).toEqual({
      success: false,
      error: 'Invalid response from RPC server',
    })
  })

  it('handles unexpected thrown errors', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockRejectedValue(new Error('Fatal error'))

    const result = await getLatestLedgerConnectionCheck('https://fatal-rpc.com')

    expect(result).toEqual({
      success: false,
      error: 'Fatal error',
    })
  })

  it('passes a caller signal to the RPC request', async () => {
    const signal = new AbortController().signal
    const spy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 7,
      result: { sequence: 1 },
    })

    await getLatestLedgerConnectionCheck('https://valid-rpc.com', 1234, signal)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ signal }),
      expect.anything(),
    )
  })

  it('does not issue an RPC request when already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const spy = vi.spyOn(rpcClient, 'callRpc')
    spy.mockClear()

    const result = await getLatestLedgerConnectionCheck(
      'https://valid-rpc.com',
      undefined,
      controller.signal,
    )

    expect(result).toEqual({
      success: false,
      error: 'Connection check aborted',
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('handles cancellation during an in-flight request', async () => {
    const controller = new AbortController()
    vi.spyOn(rpcClient, 'callRpc').mockImplementation(() => {
      controller.abort()
      return Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
    })

    await expect(
      getLatestLedgerConnectionCheck(
        'https://valid-rpc.com',
        undefined,
        controller.signal,
      ),
    ).resolves.toEqual({
      success: false,
      error: 'Connection check aborted',
    })
  })
})
