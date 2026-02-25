import { isJsonRpcErrorResponse } from './isJsonRpcErrorResponse'

/**
 * Normalizes heterogeneous error sources into one app-safe structure.
 *
 * Handles:
 * - Standard Error objects
 * - Strings
 * - JSON-RPC 2.0 error responses
 * - Unknown/Empty inputs
 *
 * @param input - The error source to normalize.
 * @returns A normalized error object with code, message, and retryable flag.
 */
export function normalizeRpcError(input: unknown): {
  code: string
  message: string
  retryable: boolean
} {
  // 1. Handle JSON-RPC 2.0 error responses
  if (isJsonRpcErrorResponse(input)) {
    const { code, message } = input.error
    return {
      code: String(code),
      message: message || 'JSON-RPC Error',
      retryable: isRetryableJsonRpcCode(code),
    }
  }

  // 2. Handle Error objects
  if (input instanceof Error) {
    const code = (input as any).code
    const retryable = (input as any).retryable
    return {
      code:
        typeof code === 'string' || typeof code === 'number'
          ? String(code)
          : 'UNKNOWN',
      message: input.message || 'Unknown Error',
      retryable: typeof retryable === 'boolean' ? retryable : false,
    }
  }

  // 3. Handle string inputs
  if (typeof input === 'string' && input.trim().length > 0) {
    return {
      code: 'UNKNOWN',
      message: input,
      retryable: false,
    }
  }

  // 4. Handle object with message/code (non-Error, non-JSONRPC)
  if (input !== null && typeof input === 'object') {
    const candidate = input as Record<string, unknown>
    const message =
      typeof candidate.message === 'string' ? candidate.message : undefined
    const code =
      typeof candidate.code === 'string' || typeof candidate.code === 'number'
        ? String(candidate.code)
        : undefined
    const retryable =
      typeof candidate.retryable === 'boolean' ? candidate.retryable : false

    if (message || code) {
      return {
        code: code || 'UNKNOWN',
        message: message || 'Unknown Error',
        retryable,
      }
    }
  }

  // 5. Fallback for empty/invalid inputs
  return {
    code: 'UNKNOWN',
    message: 'Unknown Error',
    retryable: false,
  }
}

/**
 * Determines if a JSON-RPC error code is retryable.
 *
 * -32603: Internal error
 * -32000 to -32099: Server error (implementation-defined)
 */
function isRetryableJsonRpcCode(code: number): boolean {
  if (code === -32603) {
    return true
  }
  if (code >= -32099 && code <= -32000) {
    return true
  }
  return false
}
