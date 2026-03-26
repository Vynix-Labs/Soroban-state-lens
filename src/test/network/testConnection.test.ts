import { describe, expect, it, vi } from 'vitest'
import { testRpcConnection } from '../../lib/network/testConnection'
import * as rpcClient from '../../lib/network/rpcClient'

describe('testRpcConnection', () => {
  it('should return success true for valid response', async () => {
    const spy = vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { networkPassphrase: 'Test Passphrase' },
    })

    const result = await testRpcConnection('https://valid-rpc.com')
    expect(result.success).toBe(true)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://valid-rpc.com' }),
      expect.objectContaining({ method: 'getNetwork' }),
    )
  })

  it('should return success false if RpcError is returned', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      message: 'Network error',
      code: 'NETWORK_ERROR',
    } as any)

    const result = await testRpcConnection('https://invalid-rpc.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should return success false if response is invalid', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockResolvedValue({
      something: 'else',
    } as any)

    const result = await testRpcConnection('https://weird-rpc.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid response from RPC server')
  })

  it('should handle thrown errors', async () => {
    vi.spyOn(rpcClient, 'callRpc').mockRejectedValue(new Error('Fatal error'))

    const result = await testRpcConnection('https://fatal-rpc.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Fatal error')
  })
})
