/**
 * simulateTransaction adapter for Soroban State Lens
 * Translates simulation responses into reusable discovery data
 */

import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'

export interface SimulateTransactionParams {
  rpcUrl: string
  /** Base64 transaction envelope XDR to simulate. */
  transaction: string
  signal?: AbortSignal
}

export interface SimulateTransactionResponse {
  results?: Array<{
    auth?: Array<unknown>
    xdr?: string
  }>
  footprint?: {
    readOnly?: Array<string>
    readWrite?: Array<string>
  }
  error?: string
  latestLedger?: number
}

export interface SimulateTransactionResult {
  success: boolean
  latestLedger?: number
  results?: Array<{
    auth?: Array<unknown>
    xdr?: string
  }>
  footprint?: {
    readOnly: Array<string>
    readWrite: Array<string>
  }
  error?: string
}

/**
 * Adapts a raw simulateTransaction response into a typed result shape
 */
export function simulateTransactionAdapter(
  response: SimulateTransactionResponse | null | undefined,
): SimulateTransactionResult {
  if (!response) {
    return { success: false, error: 'No response provided' }
  }

  if (response.error) {
    return { success: false, error: response.error }
  }

  return {
    success: true,
    latestLedger: response.latestLedger,
    results: response.results ?? [],
    footprint: {
      readOnly: response.footprint?.readOnly ?? [],
      readWrite: response.footprint?.readWrite ?? [],
    },
  }
}

/**
 * Sends a `simulateTransaction` JSON-RPC request and returns a normalized
 * result shape. Request failures (HTTP errors, JSON-RPC errors, malformed
 * payloads, and aborts) are surfaced as handled {@link SimulateTransactionResult}
 * values instead of thrown exceptions, so callers can branch on `success`
 * without try/catch.
 */
export async function simulateTransaction(
  params: SimulateTransactionParams,
): Promise<SimulateTransactionResult> {
  const { rpcUrl, transaction, signal } = params

  if (!transaction) {
    return { success: false, error: 'Transaction XDR is required' }
  }

  const requestId = toRpcRequestId()
  const payload = buildJsonRpcRequest(
    'simulateTransaction',
    { transaction },
    requestId,
  )

  let response: Response
  try {
    response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    // Detect aborts by the canonical `name` rather than `instanceof Error`,
    // since DOMException is not an Error subclass and fetch implementations
    // surface aborts as DOMException('AbortError') / plain objects.
    if (error != null && typeof error === 'object' && 'name' in error && (error as { name: unknown }).name === 'AbortError') {
      return { success: false, error: 'Request aborted' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }

  if (!response.ok) {
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON response',
    }
  }

  if (isJsonRpcErrorResponse(data)) {
    return {
      success: false,
      error: `RPC Error (${data.error.code}): ${data.error.message}`,
    }
  }

  if (!isJsonRpcSuccessResponse(data)) {
    return { success: false, error: 'Invalid JSON-RPC response format' }
  }

  const result = data.result as SimulateTransactionResponse | undefined
  return simulateTransactionAdapter(result ?? null)
}
