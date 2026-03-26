import { callRpc } from './rpcClient'
import type { RpcError } from './types'

export interface TestConnectionResult {
  success: boolean
  error?: string
}

/**
 * Tests a Soroban RPC connection by calling the 'getNetwork' method.
 *
 * @param url The RPC URL to test.
 * @returns A promise that resolves to a TestConnectionResult.
 */
export async function testRpcConnection(url: string): Promise<TestConnectionResult> {
  try {
    const result = await callRpc<any>(
      {
        url,
        timeout: 5000,
      },
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getNetwork',
        params: {},
      },
    )

    if ('message' in (result as object) && (result as RpcError).message) {
      const rpcError = result as RpcError
      return {
        success: false,
        error: rpcError.message || 'Unknown RPC error',
      }
    }

    // Soroban RPC getNetwork returns an object with networkPassphrase, etc.
    // If it's a valid JSON-RPC success response, it will have a 'result' property
    // But callRpc returns the parsed JSON body (which is the whole JSON-RPC response)
    if (result && typeof result === 'object' && 'result' in result) {
      return { success: true }
    }

    return {
      success: false,
      error: 'Invalid response from RPC server',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
