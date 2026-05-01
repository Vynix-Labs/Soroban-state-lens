import { shouldRetryRpcError } from './shouldRetryRpcError'
import { computeRetryDelayMs } from './computeRetryDelayMs'
import { withJitter } from './withJitter'
import { isJsonRpcErrorResponse } from './isJsonRpcErrorResponse'

export interface RpcRetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isRpcClientError(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>

  // Exclude valid JSON-RPC success responses to be safe
  if ('jsonrpc' in candidate && 'result' in candidate) {
    return false
  }

  const hasMessageString = typeof candidate.message === 'string'
  const hasCodeOrTimeout = 'code' in candidate || 'isTimeout' in candidate

  return hasMessageString && hasCodeOrTimeout
}

function shouldRetry(errorObj: unknown): boolean {
  let status: number | undefined
  let code: string | number | undefined

  if (isJsonRpcErrorResponse(errorObj)) {
    code = errorObj.error.code
  } else if (typeof errorObj === 'object' && errorObj !== null) {
    const candidate = errorObj as Record<string, unknown>
    if (typeof candidate.status === 'number') {
      status = candidate.status
    }

    if (candidate.code !== undefined) {
      if (
        typeof candidate.code === 'number' &&
        candidate.code >= 100 &&
        candidate.code <= 599 &&
        status === undefined
      ) {
        // rpcClient uses `code` for HTTP status for non-200 responses
        status = candidate.code
      } else {
        code = candidate.code as string | number
      }
    }
  }

  // Check native error object
  if (errorObj instanceof Error) {
    const errCode = (errorObj as any).code
    if (code === undefined && errCode !== undefined) {
      code = errCode
    }
  }

  return shouldRetryRpcError({ status, code })
}

/**
 * A reusable wrapper that executes an asynchronous operation and applies
 * bounded exponential backoff for transient RPC or Network failures.
 *
 * @param operation The function to execute. Can throw or return an error object.
 * @param options Configurations for retry limits and backoff timing.
 * @returns The successful result, or the final failure if retries are exhausted.
 */
export async function withRpcRetries<T>(
  operation: () => Promise<T>,
  options: RpcRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 250
  const maxDelayMs = options.maxDelayMs ?? 5000
  const jitterRatio = options.jitterRatio ?? 0.2

  let attempt = 1

  for (;;) {
    let result: T | undefined
    let errorObj: unknown = null
    let didThrow = false

    try {
      result = await operation()

      // Determine if a successful promise resolution is conceptually an error
      if (isJsonRpcErrorResponse(result)) {
        errorObj = result
      } else if (isRpcClientError(result)) {
        errorObj = result
      }
    } catch (err) {
      didThrow = true
      errorObj = err
    }

    if (!errorObj) {
      return result as T
    }

    if (attempt >= maxAttempts || !shouldRetry(errorObj)) {
      if (didThrow) {
        throw errorObj
      }
      return result as T
    }

    const delayMs = computeRetryDelayMs(attempt - 1, baseDelayMs, maxDelayMs)
    const jitteredMs = withJitter(delayMs, jitterRatio)
    await delay(jitteredMs)

    attempt++
  }
}
