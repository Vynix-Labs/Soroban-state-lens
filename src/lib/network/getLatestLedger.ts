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
  if (typeof candidate.sequence !== 'number') {
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
): Promise<GetLatestLedgerConnectionResult> {
  try {
    const response = await callRpc(
      {
        url,
        timeout: 5000,
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
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
