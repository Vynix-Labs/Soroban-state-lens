import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { callRpc } from './rpcClient'
import type { LatestLedgerResult, RpcError, RpcRequestOptions } from './types'

export interface GetLatestLedgerConnectionResult {
  success: boolean
  ledger?: LatestLedgerResult
  error?: string
}

export interface LatestLedgerConnectionCheckOptions extends RpcRequestOptions {
  timeout?: number
  signal?: AbortSignal
}

function isRpcError(value: unknown): value is RpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as RpcError).message === 'string'
  )
}

function parseLatestLedgerResult(value: unknown): LatestLedgerResult | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.sequence !== 'number' ||
    !Number.isFinite(candidate.sequence) ||
    !Number.isInteger(candidate.sequence) ||
    candidate.sequence < 0
  ) {
    return null
  }

  const ledger: LatestLedgerResult = { sequence: candidate.sequence }
  if (typeof candidate.id === 'string') {
    ledger.id = candidate.id
  }

  if (typeof candidate.protocolVersion === 'number') {
    if (
      !Number.isFinite(candidate.protocolVersion) ||
      !Number.isInteger(candidate.protocolVersion) ||
      candidate.protocolVersion < 0
    ) {
      return null
    }
    ledger.protocolVersion = candidate.protocolVersion
  }

  return ledger
}

export async function getLatestLedgerConnectionCheck(
  url: string,
  timeoutOrOptions?: number | LatestLedgerConnectionCheckOptions,
  callerSignal?: AbortSignal,
): Promise<GetLatestLedgerConnectionResult> {
  const timeoutMs =
    typeof timeoutOrOptions === 'number'
      ? timeoutOrOptions
      : timeoutOrOptions?.timeoutMs ?? timeoutOrOptions?.timeout
  const signal =
    typeof timeoutOrOptions === 'object'
      ? timeoutOrOptions.signal ?? callerSignal
      : callerSignal

  if (signal?.aborted) {
    return { success: false, error: 'Connection check aborted' }
  }

  try {
    const requestId = toRpcRequestId()
    const response = await callRpc(
      {
        url,
        timeout: normalizeTimeoutMs(timeoutMs, 5000),
        signal,
      },
      buildJsonRpcRequest('getLatestLedger', {}, requestId),
    )

    if (isRpcError(response)) {
      return {
        success: false,
        error: response.message || 'Connection failed',
      }
    }

    if (!isJsonRpcSuccessResponse(response, requestId)) {
      return {
        success: false,
        error: 'Invalid response from RPC server',
      }
    }

    const ledger = parseLatestLedgerResult(response.result)
    if (ledger === null) {
      return {
        success: false,
        error: 'Invalid response from RPC server',
      }
    }

    return {
      success: true,
      ledger,
    }
  } catch (error) {
    return {
      success: false,
      error:
        signal?.aborted
          ? 'Connection check aborted'
          : error instanceof Error
            ? error.message
            : 'Connection failed',
    }
  }
}
