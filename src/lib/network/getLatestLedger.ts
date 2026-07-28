import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { callRpc } from './rpcClient'
import type { LatestLedgerResult, RpcError } from './types'

export interface GetLatestLedgerConnectionResult {
  success: boolean
  ledger?: LatestLedgerResult
  error?: string
}

export interface LatestLedgerConnectionCheckOptions {
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

  const ledger: LatestLedgerResult = {
    sequence: candidate.sequence,
  }

  if (typeof candidate.id === 'string') {
    ledger.id = candidate.id
  }

  if (typeof candidate.protocolVersion === 'number') {
    ledger.protocolVersion = candidate.protocolVersion
  }

  return ledger
}

export async function getLatestLedgerConnectionCheck(
  url: string,
): Promise<GetLatestLedgerConnectionResult>
export async function getLatestLedgerConnectionCheck(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<GetLatestLedgerConnectionResult>
export async function getLatestLedgerConnectionCheck(
  url: string,
  options?: LatestLedgerConnectionCheckOptions,
): Promise<GetLatestLedgerConnectionResult>
export async function getLatestLedgerConnectionCheck(
  url: string,
  timeoutOrOptions?: number | LatestLedgerConnectionCheckOptions,
  signal?: AbortSignal,
): Promise<GetLatestLedgerConnectionResult> {
  const resolvedOptions =
    typeof timeoutOrOptions === 'number'
      ? { timeout: timeoutOrOptions, signal }
      : timeoutOrOptions

  if (resolvedOptions?.signal?.aborted || signal?.aborted) {
    return {
      success: false,
      error: 'Connection check aborted',
    }
  }

  try {
    const response = await callRpc(
      {
        url,
        timeout: resolvedOptions?.timeout ?? 5000,
        signal: resolvedOptions?.signal ?? signal,
      },
      buildJsonRpcRequest('getLatestLedger', {}, toRpcRequestId()),
    )

    if (isRpcError(response)) {
      return {
        success: false,
        error: response.message || 'Connection failed',
      }
    }

    if (!isJsonRpcSuccessResponse(response)) {
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
      error: resolvedOptions?.signal?.aborted || signal?.aborted
        ? 'Connection check aborted'
        : error instanceof Error
          ? error.message
          : 'Connection failed',
    }
  }
}
