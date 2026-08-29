import { shouldRetryRpcError } from './shouldRetryRpcError'
import { computeRetryDelayMs } from './computeRetryDelayMs'
import { withJitter } from './withJitter'
import { isJsonRpcErrorResponse } from './isJsonRpcErrorResponse'

function isAbortError(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }

  if (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return true
  }

  return false
}

export interface RpcRetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
  signal?: AbortSignal
}

function normalizeMaxAttempts(value: number | undefined): number {
  if (value === undefined) return 3
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

function normalizeDelay(value: number | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

function normalizeJitterRatio(value: number | undefined): number {
  if (value === undefined) return 0.2
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted.', 'AbortError')
  }

  const error = new Error('The operation was aborted.')
  error.name = 'AbortError'
  return error
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const timeoutId = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }

    const cleanup = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })

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
  const maxAttempts = normalizeMaxAttempts(options.maxAttempts)
  const baseDelayMs = normalizeDelay(options.baseDelayMs, 250)
  const maxDelayMs = normalizeDelay(options.maxDelayMs, 5000)
  const jitterRatio = normalizeJitterRatio(options.jitterRatio)
  const signal = options.signal

  let attempt = 1

  for (;;) {
    if (signal?.aborted) throw createAbortError()
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

    try {
      await delay(jitteredMs, options.signal)
    } catch (error) {
      if (isAbortError(error)) {
        throw error
      }
      throw error
    }

    attempt++
  }
}
