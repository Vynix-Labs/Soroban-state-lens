import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { withRpcRetries } from '../rpc/withRpcRetries'

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
 * Normalized error shape returned by the retry-wrapped operation so
 * {@link withRpcRetries} can classify transient failures (429, 5xx, JSON-RPC
 * transient codes) against the shared retry policy before re-surfacing them.
 */
interface LedgerEntriesRpcError {
  message: string
  /** HTTP status for HTTP failures, or JSON-RPC error code. */
  code?: string | number
  /** HTTP status mirrored for the retry classifier. */
  status?: number
  details?: string
}

type LedgerEntriesOpResult = GetLedgerEntriesResult | LedgerEntriesRpcError

function isRpcError(
  value: LedgerEntriesOpResult,
): value is LedgerEntriesRpcError {
  return !('entries' in value)
}

/**
 * Fetches ledger entries for the given keys using a raw JSON-RPC request.
 * Honors the provided AbortSignal for cancellation and routes the network
 * call through the shared {@link withRpcRetries} retry policy so transient
 * 429 and 5xx failures are retried up to the configured cap.
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

  // Stable guard: an empty keys array never reaches the RPC endpoint and
  // resolves to a handled empty result instead of an untyped request error.
  if (keys.length === 0) {
    return { entries: [], latestLedger: 0 }
  }

  if (signal?.aborted) {
    throw new AbortError()
  }

  const requestId = toRpcRequestId()

  const result = await withRpcRetries<LedgerEntriesOpResult>(async () => {
    const payload = buildJsonRpcRequest('getLedgerEntries', [keys], requestId)

    let response: Response
    try {
      response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        throw new AbortError()
      }
      // Surfaced as a retryable network error to the retry classifier.
      return {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      }
    }

    if (signal?.aborted) {
      throw new AbortError()
    }

    if (!response.ok) {
      return {
        message: `HTTP error! status: ${response.status}`,
        code: response.status,
        status: response.status,
      }
    }

    const data = (await response.json()) as unknown

    if (signal?.aborted) {
      throw new AbortError()
    }

    if (isJsonRpcErrorResponse(data)) {
      return {
        message: `RPC Error (${data.error.code}): ${data.error.message}`,
        code: data.error.code,
      }
    }

    if (!isJsonRpcSuccessResponse(data)) {
      return { message: 'Invalid JSON-RPC response format', code: 'INVALID' }
    }

    const opResult = data.result as {
      entries: Array<{
        key: string
        xdr: string
        lastModifiedLedgerSeq?: number
        liveUntilLedgerSeq?: number
      }> | null
      latestLedger: number
    }

    return {
      entries: (opResult.entries ?? []).map((entry) => ({
        key: entry.key,
        xdr: entry.xdr,
        lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
        liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
      })),
      latestLedger: opResult.latestLedger,
    }
  })

  if (isRpcError(result)) {
    throw new Error(result.message)
  }

  return result
}