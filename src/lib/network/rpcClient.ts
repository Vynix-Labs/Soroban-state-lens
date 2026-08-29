import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
import { normalizeRpcUrl } from '../validation/normalizeRpcUrl'
import type { RpcConfig, RpcError } from './types'

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

export async function callRpc<T = unknown>(
  config: RpcConfig,
  body?: unknown,
): Promise<T | RpcError> {
  const normalized = normalizeRpcUrl(config.url)
  const normalizedTimeout = normalizeTimeoutMs(config.timeout)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), normalizedTimeout)

  // Link an optional caller-provided signal so route changes can abort
  // in-flight RPC calls. The internal timeout controller still drives the
  // fetch signal; the caller signal only fans its abort into that controller.
  let callerAborted = false
  const callerSignal = config.signal
  const onCallerAbort = () => {
    callerAborted = true
    controller.abort()
  }
  if (callerSignal) {
    if (callerSignal.aborted) {
      callerAborted = true
      controller.abort()
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true })
    }
  }

  try {
    const response = await fetch(normalized, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
        details: errorText,
        isTimeout: false,
      }
    }

    // A successful (2xx) response with no body is not a parseable RPC
    // payload. This commonly happens during proxy or maintenance failures
    // (e.g. a bare 204, or a 200 with an empty body). Peek at the body via
    // a clone so `response.json()` below is unaffected when this check
    // can't be performed (e.g. in test doubles that don't implement
    // `clone`/`text`).
    let bodyText: string | undefined
    try {
      bodyText = await response.clone().text()
    } catch {
      bodyText = undefined
    }
    if (bodyText !== undefined && bodyText.trim().length === 0) {
      return {
        message: 'Empty RPC response body',
        code: 'INVALID_RESPONSE',
        details: `Received HTTP ${response.status} with an empty response body`,
        isTimeout: false,
      }
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    if (isAbortError(error)) {
      if (callerAborted) {
        return {
          message: 'Request aborted',
          code: 'ABORTED',
          details: 'Caller aborted the request',
          isTimeout: false,
        }
      }
      return {
        message: 'Request timeout',
        code: 'TIMEOUT',
        details: `Request timed out after ${normalizedTimeout}ms`,
        isTimeout: true,
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    if (
      error instanceof SyntaxError ||
      (typeof errorMessage === 'string' && /JSON/i.test(errorMessage))
    ) {
      return {
        message: 'Invalid JSON response',
        code: 'INVALID_JSON',
        details: errorMessage,
        isTimeout: false,
      }
    }

    if (error instanceof TypeError) {
      return {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        details: error.message,
        isTimeout: false,
      }
    }

    return {
      message: errorMessage,
      code: 'UNKNOWN_ERROR',
      details: error,
      isTimeout: false,
    }
  } finally {
    clearTimeout(timeoutId)
    if (callerSignal) {
      callerSignal.removeEventListener('abort', onCallerAbort)
    }
  }
}
