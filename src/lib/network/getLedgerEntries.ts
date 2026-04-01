import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'

export interface GetLedgerEntriesParams {
  rpcUrl: string
  keys: Array<string>
  signal?: AbortSignal
}

export interface LedgerEntry {
  key: string
  xdr: string
  lastModifiedLedgerSeq?: number
  liveUntilLedgerSeq?: number
}

export interface GetLedgerEntriesResult {
  entries: Array<LedgerEntry>
  latestLedger: number
}

export class AbortError extends Error {
  constructor(message = 'Request was aborted') {
    super(message)
    this.name = 'AbortError'
  }
}

/**
 * Fetches ledger entries for the given keys using a raw JSON-RPC request.
 * Honors the provided AbortSignal for cancellation.
 *
 * @param params - RPC URL, array of base64 ledger keys, and optional AbortSignal.
 * @returns Parsed ledger entries and latest ledger sequence.
 * @throws AbortError if the request is aborted.
 * @throws Error on network or RPC errors.
 */
export async function getLedgerEntries(
  params: GetLedgerEntriesParams,
): Promise<GetLedgerEntriesResult> {
  const { rpcUrl, keys, signal } = params

  if (signal?.aborted) {
    throw new AbortError()
  }

  const requestId = toRpcRequestId()
  const payload = buildJsonRpcRequest('getLedgerEntries', [keys], requestId)

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    })

    if (signal?.aborted) {
      throw new AbortError()
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as unknown

    if (signal?.aborted) {
      throw new AbortError()
    }

    if (isJsonRpcErrorResponse(data)) {
      throw new Error(`RPC Error (${data.error.code}): ${data.error.message}`)
    }

    if (!isJsonRpcSuccessResponse(data)) {
      throw new Error('Invalid JSON-RPC response format')
    }

    const result = data.result as {
      entries: Array<{
        key: string
        xdr: string
        lastModifiedLedgerSeq?: number
        liveUntilLedgerSeq?: number
      }> | null
      latestLedger: number
    }

    return {
      entries: (result.entries || []).map((entry) => ({
        key: entry.key,
        xdr: entry.xdr,
        lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
        liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
      })),
      latestLedger: result.latestLedger,
    }
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.name === 'AbortError') ||
      (error instanceof DOMException && error.name === 'AbortError')
    ) {
      throw new AbortError()
    }
    throw error
  }
}
