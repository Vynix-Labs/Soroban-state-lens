/**
 * simulateTransaction adapter for Soroban State Lens
 * Translates simulation responses into reusable discovery data
 */

import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { normalizeFootprintKeys } from './normalizeFootprintKeys'
import { callRpc } from './rpcClient'
import type { RpcError, RpcRequestOptions } from './types'

export interface SimulateTransactionParams extends RpcRequestOptions {
  rpcUrl: string
  /** Base64 transaction envelope XDR to simulate. */
  transaction: string
}

export interface SimulateTransactionResponse {
  results?: unknown
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

const activeSimulationControllers = new Map<string, AbortController>()

const abortedSimulationResult: SimulateTransactionResult = {
  success: false,
  error: 'Request aborted',
}

function sanitizeFootprintSection(value: unknown): Array<string> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.every((item) => typeof item === 'string') ? value : []
}

function sanitizeSimulationResults(
  value: unknown,
): NonNullable<SimulateTransactionResult['results']> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return []
    }

    const result = item as Record<string, unknown>
    const hasAuth = Object.hasOwn(result, 'auth')
    const hasXdr = Object.hasOwn(result, 'xdr')
    if (
      (!hasAuth && !hasXdr) ||
      (hasAuth && !Array.isArray(result.auth)) ||
      (hasXdr && typeof result.xdr !== 'string')
    ) {
      return []
    }

    return [
      {
        ...(hasAuth ? { auth: result.auth as Array<unknown> } : {}),
        ...(hasXdr ? { xdr: result.xdr as string } : {}),
      },
    ]
  })
}

function isRpcError(value: unknown): value is RpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'code' in value
  )
}

/**
 * Maps common auth failure messages to concise, actionable discovery messages.
 * Returns the original message when no auth failure pattern matches.
 */
export function mapSimulationAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (
    /expired (auth|authorization)? ?(token|credential)|token has expired/.test(
      normalized,
    )
  ) {
    return 'Authorization expired: refresh your RPC credentials and try again.'
  }

  if (
    /missing authorization header|authorization required|missing (auth|authorization) token/.test(
      normalized,
    )
  ) {
    return 'Authorization required: add your RPC credentials and try again.'
  }

  if (
    /unauthorized|invalid auth token|invalid authorization token/.test(
      normalized,
    )
  ) {
    return 'Authorization failed: check your RPC credentials and try again.'
  }

  if (
    normalized.includes('invalid auth') ||
    normalized.includes('auth entry is invalid') ||
    normalized.includes('unsupported auth')
  ) {
    return 'Authorization entry is invalid. Regenerate the auth entry and simulate again.'
  }

  if (
    normalized.includes('missing auth') ||
    normalized.includes('auth entry not found') ||
    normalized.includes('no auth entry')
  ) {
    return 'Authorization entry is missing. Add the required auth entry and simulate again.'
  }

  if (
    normalized.includes('auth failed') ||
    normalized.includes('failed to authorize') ||
    normalized.includes('authorization failed')
  ) {
    return 'Authorization failed. Check the signer and auth entry, then simulate again.'
  }

  if (
    normalized.includes('signature verification failed') ||
    normalized.includes('invalid signature') ||
    normalized.includes('signature is invalid')
  ) {
    return 'Authorization signature is invalid. Resign the auth entry and simulate again.'
  }

  return message
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
    return { success: false, error: mapSimulationAuthError(response.error) }
  }

  if (
    response.latestLedger !== undefined &&
    (!Number.isFinite(response.latestLedger) ||
      !Number.isInteger(response.latestLedger) ||
      response.latestLedger < 0)
  ) {
    return { success: false, error: 'Invalid latest ledger value' }
  }

  const result: SimulateTransactionResult = {
    success: true,
    latestLedger: response.latestLedger,
    results: sanitizeSimulationResults(response.results),
    footprint: {
      readOnly: sanitizeFootprintSection(response.footprint?.readOnly),
      readWrite: sanitizeFootprintSection(response.footprint?.readWrite),
    },
  }

  const footprint = normalizeFootprintKeys(result)
  return {
    ...result,
    footprint: {
      readOnly: footprint.readOnly,
      readWrite: footprint.readWrite,
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
  const previousController = activeSimulationControllers.get(params.rpcUrl)
  previousController?.abort()

  if (!params.transaction) {
    return { success: false, error: 'Transaction XDR is required' }
  }

  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  if (params.signal?.aborted) {
    controller.abort()
  } else {
    params.signal?.addEventListener('abort', abortFromCaller, { once: true })
  }
  activeSimulationControllers.set(params.rpcUrl, controller)

  try {
    const result = await performSimulationRequest({
      ...params,
      signal: controller.signal,
    })

    return controller.signal.aborted ? abortedSimulationResult : result
  } finally {
    params.signal?.removeEventListener('abort', abortFromCaller)
    if (activeSimulationControllers.get(params.rpcUrl) === controller) {
      activeSimulationControllers.delete(params.rpcUrl)
    }
  }
}

async function performSimulationRequest(
  params: SimulateTransactionParams,
): Promise<SimulateTransactionResult> {
  const { rpcUrl, transaction, signal } = params

  const requestId = toRpcRequestId()
  const payload = buildJsonRpcRequest(
    'simulateTransaction',
    { transaction },
    requestId,
  )

  const data = await callRpc<unknown>(
    {
      url: rpcUrl,
      timeout: normalizeTimeoutMs(params.timeoutMs, 10_000),
      signal,
    },
    payload,
  )

  if (isRpcError(data)) {
    if (data.code === 'ABORTED') {
      return { success: false, error: 'Request aborted' }
    }
    const message =
      data.code === 'NETWORK_ERROR' && typeof data.details === 'string'
        ? data.details
        : data.message
    return { success: false, error: mapSimulationAuthError(message) }
  }

  if (isJsonRpcErrorResponse(data, requestId)) {
    return {
      success: false,
      error: mapSimulationAuthError(
        `RPC Error (${data.error.code}): ${data.error.message}`,
      ),
    }
  }

  if (!isJsonRpcSuccessResponse(data, requestId)) {
    return { success: false, error: 'Invalid JSON-RPC response format' }
  }

  const result = data.result as SimulateTransactionResponse | undefined
  return simulateTransactionAdapter(result ?? null)
}
