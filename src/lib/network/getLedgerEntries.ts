import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { isJsonRpcErrorResponse } from '../rpc/isJsonRpcErrorResponse'
import { isJsonRpcSuccessResponse } from '../rpc/isJsonRpcSuccessResponse'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { withRpcRetries } from '../rpc/withRpcRetries'
import { normalizeRpcUrl } from '../validation/normalizeRpcUrl'
import { deduplicateKeys } from './deduplicateKeys'

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
  const { rpcUrl, keys: inputKeys, signal } = params

  // Deduplicate keys while preserving first-seen order
  const keys = deduplicateKeys(inputKeys)

  if (signal?.aborted) {
    throw new AbortError()
  }

  // Stable guard: an empty keys array never reaches the RPC endpoint and
  // resolves to a handled empty result instead of an untyped request error.
  if (keys.length === 0) {
    return { entries: [], latestLedger: 0 }
  }
  const normalized = normalizeRpcUrl(rpcUrl)
  if (normalized === '') {
    throw new Error('Invalid RPC URL')
  }
  const requestId = toRpcRequestId()

  const result = await withRpcRetries<LedgerEntriesOpResult>(async () => {
    const payload = buildJsonRpcRequest('getLedgerEntries', [keys], requestId)

    let response: Response
    try {
      response = await fetch(normalized, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
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

    if (isJsonRpcErrorResponse(data, requestId)) {
      return {
        message: `RPC Error (${data.error.code}): ${data.error.message}`,
        code: data.error.code,
      }
    }

    if (!isJsonRpcSuccessResponse(data, requestId)) {
      return { message: 'Invalid JSON-RPC response format', code: 'INVALID' }
    }

    const rawResult = data.result
    if (typeof rawResult !== 'object' || rawResult === null) {
      return { message: 'Invalid JSON-RPC response format', code: 'INVALID' }
    }

    const opResult = rawResult as {
      entries?: unknown
      latestLedger?: unknown
    }

    if (
      !('entries' in opResult) ||
      !(opResult.entries === null || Array.isArray(opResult.entries)) ||
      typeof opResult.latestLedger !== 'number' ||
      !Number.isFinite(opResult.latestLedger) ||
      !Number.isInteger(opResult.latestLedger) ||
      opResult.latestLedger < 0
    ) {
      return { message: 'Invalid JSON-RPC response format', code: 'INVALID' }
    }

    if (Array.isArray(opResult.entries)) {
      const isValidEntries = opResult.entries.every((entry: unknown) => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        return (
          typeof (entry as { key?: unknown }).key === 'string' &&
          typeof (entry as { xdr?: unknown }).xdr === 'string'
        )
      })

      if (!isValidEntries) {
        return { message: 'Invalid JSON-RPC response format', code: 'INVALID' }
      }
    }

    // Deduplicate by key, keep first-seen records
    const seen = new Set<string>()
    const deduped = [] as Array<{
      key: string
      xdr: string
      lastModifiedLedgerSeq?: number
      liveUntilLedgerSeq?: number
    }>

    for (const entry of opResult.entries || []) {
      if (!seen.has(entry.key)) {
        seen.add(entry.key)
        deduped.push({
          key: entry.key,
          xdr: entry.xdr,
          lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
          liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
        })
      }
    }

    return {
      entries: deduped,
      latestLedger: opResult.latestLedger,
    }
  })

  if (isRpcError(result)) {
    throw new Error(result.message)
  }

  return result
}
