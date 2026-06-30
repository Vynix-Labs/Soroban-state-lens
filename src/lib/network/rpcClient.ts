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
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

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
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

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
    clearTimeout(timeoutId)

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
        details: `Request timed out after ${config.timeout}ms`,
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
    if (callerSignal) {
      callerSignal.removeEventListener('abort', onCallerAbort)
    }
  }
}