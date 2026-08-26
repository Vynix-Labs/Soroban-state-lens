import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
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
    // Merge headers while ensuring the required JSON content type cannot
    // be replaced by a caller-provided value (case-insensitive).
    const mergedHeaders: Record<string, string> = {}

    // Copy caller headers first (normalized as provided) so we can include
    // other custom values, but we will enforce Content-Type below.
    if (config.headers) {
      for (const [k, v] of Object.entries(config.headers)) {
        mergedHeaders[k] = v
      }
    }

    // Ensure Content-Type header is set to application/json and cannot be
    // overridden by callers. Respect existing casing for other headers.
    // Detect any existing Content-Type key in caller headers (case-insensitive)
    // and remove it so we can set the canonical value.
    for (const key of Object.keys(mergedHeaders)) {
      if (key.toLowerCase() === 'content-type') {
        delete mergedHeaders[key]
      }
    }

    // Set the required content type.
    mergedHeaders['Content-Type'] = 'application/json'

    const response = await fetch(config.url, {
      method: 'POST',
      headers: mergedHeaders,
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

    if (error instanceof TypeError) {
      return {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        details: error.message,
        isTimeout: false,
      }
    }

    return {
      message: error instanceof Error ? error.message : 'Unknown error',
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