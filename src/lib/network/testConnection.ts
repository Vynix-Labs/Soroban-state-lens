import { getLatestLedgerConnectionCheck } from './getLatestLedger'

export interface TestConnectionResult {
  success: boolean
  error?: string
}

/**
 * Tests a Soroban RPC connection by calling the 'getLatestLedger' method.
 *
 * @param url The RPC URL to test.
 * @returns A promise that resolves to a TestConnectionResult.
 */
export async function testRpcConnection(
  url: string,
): Promise<TestConnectionResult> {
  const result = await getLatestLedgerConnectionCheck(url)

  if (result.success) {
    return { success: true }
  }

  return {
    success: false,
    error: result.error || 'Connection failed',
  }
}
