import { describe, expect, it, vi } from 'vitest'
import { testRpcConnection } from '../../lib/network/testConnection'
import * as latestLedger from '../../lib/network/getLatestLedger'

describe('testRpcConnection', () => {
  it('should return success true for valid response', async () => {
    const spy = vi
      .spyOn(latestLedger, 'getLatestLedgerConnectionCheck')
      .mockResolvedValue({
        success: true,
        ledger: { sequence: 12345 },
      })

    const result = await testRpcConnection('https://valid-rpc.com')
    expect(result.success).toBe(true)
    expect(spy).toHaveBeenCalledWith('https://valid-rpc.com')
  })

  it('should return success false if latest ledger check fails', async () => {
    vi.spyOn(latestLedger, 'getLatestLedgerConnectionCheck').mockResolvedValue({
      success: false,
      error: 'Network error',
    })

    const result = await testRpcConnection('https://invalid-rpc.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should return success false if no error message is provided', async () => {
    vi.spyOn(latestLedger, 'getLatestLedgerConnectionCheck').mockResolvedValue({
      success: false,
    })

    const result = await testRpcConnection('https://weird-rpc.com')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Connection failed')
  })
})
