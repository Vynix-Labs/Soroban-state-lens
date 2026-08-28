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

  it('forwards timeout and signal to rpcClient', async () => {
    const signal = new AbortController().signal
    const spy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 7,
      result: {
        sequence: 123456,
      },
    })

    await getLatestLedgerConnectionCheck('https://valid-rpc.com', {
      timeout: 1234,
      signal,
    })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://valid-rpc.com',
        timeout: 1234,
        signal,
      }),
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

  it('returns an aborted result when the caller signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await getLatestLedgerConnectionCheck('https://valid-rpc.com', {
      signal: controller.signal,
    })

    expect(result).toEqual({
      success: false,
      error: 'Connection check aborted',
    })
  })
})
