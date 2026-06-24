import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { callRpc } from './rpcClient'
import type { RpcError } from './types'

export interface GetContractWasmParams {
  rpcUrl: string
  contractId: string
}

export interface GetContractWasmSuccess {
  success: true
  wasm: Uint8Array
}

export interface GetContractWasmFailure {
  success: false
  error: string
}

export type GetContractWasmResult =
  | GetContractWasmSuccess
  | GetContractWasmFailure

function isRpcError(value: unknown): value is RpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as RpcError).message === 'string'
  )
}

function parseContractCodeResult(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    const candidate = value as Record<string, unknown>
    if (typeof candidate.code === 'string') {
      return candidate.code
    }
    if (typeof candidate.wasm === 'string') {
      return candidate.wasm
    }
    if (typeof candidate.contractCode === 'string') {
      return candidate.contractCode
    }
  }

  return null
}

function decodeBase64ToBytes(value: string): Uint8Array {
  const binaryString = atob(value)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export async function getContractWasm(
  params: GetContractWasmParams,
): Promise<GetContractWasmResult> {
  try {
    const response = await callRpc(
      {
        url: params.rpcUrl,
        timeout: 10000,
      },
      buildJsonRpcRequest(
        'getContractCode',
        [params.contractId],
        toRpcRequestId(),
      ),
    )

    if (isRpcError(response)) {
      return {
        success: false,
        error: response.message || 'RPC request failed',
      }
    }

    if (!isJsonRpcSuccessResponse(response)) {
      return {
        success: false,
        error: 'Invalid response from RPC server',
      }
    }

    const encodedWasm = parseContractCodeResult(response.result)
    if (!encodedWasm) {
      return {
        success: false,
        error: 'Contract code response is missing or malformed',
      }
    }

    try {
      return {
        success: true,
        wasm: decodeBase64ToBytes(encodedWasm),
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to decode contract WASM bytes',
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}
