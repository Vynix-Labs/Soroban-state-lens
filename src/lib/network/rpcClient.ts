import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
import { normalizeRpcUrl } from '../validation/normalizeRpcUrl'
import type { RpcConfig, RpcError } from './types'

const DEFAULT_MAX_RESPONSE_BYTES = 1024 * 1024

class RpcResponseTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`RPC response exceeds maximum size of ${maxBytes} bytes`)
    this.name = 'RpcResponseTooLargeError'
  }
}

function getMaxResponseBytes(config: RpcConfig): number {
  const value = config.maxResponseBytes
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : DEFAULT_MAX_RESPONSE_BYTES
}

async function readResponseJson(
  response: Response,
  maxResponseBytes: number,
): Promise<unknown> {
  // Test doubles may omit headers even though a real Response always has them.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const contentLength = response.headers?.get('content-length') ?? null
  if (contentLength !== null) {
    const declaredLength = Number(contentLength)
    if (
      Number.isSafeInteger(declaredLength) &&
      declaredLength > maxResponseBytes
    ) {
      throw new RpcResponseTooLargeError(maxResponseBytes)
    }
  }

  if (!response.body) {
    return response.json()
  }

  const reader = response.body.getReader()
  const chunks: Array<Uint8Array> = []
  let totalBytes = 0

  try {
    let hasMore = true
    while (hasMore) {
      const result = await reader.read()
      hasMore = !result.done
      if (result.done) break
      const { value } = result
      totalBytes += value.byteLength
      if (totalBytes > maxResponseBytes) {
        await reader.cancel()
        throw new RpcResponseTooLargeError(maxResponseBytes)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(bytes))
}

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
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(config.headers ?? {})) {
      if (key.toLowerCase() !== 'content-type') {
        headers[key] = value
      }
    }
    headers['Content-Type'] = 'application/json'

    const response = await fetch(normalized, {
      method: 'POST',
      headers,
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

    // Detect successful responses with no usable body before streaming or JSON
    // parsing. Cloning keeps the original response available to the bounded
    // reader and supports lightweight test doubles.
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

    const data = await readResponseJson(response, getMaxResponseBytes(config))
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

    if (error instanceof RpcResponseTooLargeError) {
      return {
        message: error.message,
        code: 'RESPONSE_TOO_LARGE',
        details: { maxResponseBytes: error.maxBytes },
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
