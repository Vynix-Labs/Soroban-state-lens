import {
  getLatestLedgerConnectionCheck,
  type LatestLedgerConnectionCheckOptions,
} from './getLatestLedger'

export interface TestConnectionResult {
  success: boolean
  error?: string
}

export interface TestRpcConnectionOptions
  extends LatestLedgerConnectionCheckOptions {}

/**
 * Tests a Soroban RPC connection by calling the 'getLatestLedger' method.
 *
 * @param url The RPC URL to test.
 * @param options Optional timeout and cancellation settings.
 * @returns A promise that resolves to a TestConnectionResult.
 */
export async function testRpcConnection(
  url: string,
  options?: TestRpcConnectionOptions,
): Promise<TestConnectionResult> {
  const result = options
    ? await getLatestLedgerConnectionCheck(url, options)
    : await getLatestLedgerConnectionCheck(url)

  if (result.success) {
    return { success: true }
  }

  return {
    success: false,
    error: result.error || 'Connection failed',
  }
}
