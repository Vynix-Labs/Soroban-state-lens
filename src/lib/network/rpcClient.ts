import { normalizeTimeoutMs } from '../rpc/normalizeTimeoutMs'
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
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
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

    const data = await readResponseJson(response, getMaxResponseBytes(config))
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

    if (error instanceof RpcResponseTooLargeError) {
      return {
        message: error.message,
        code: 'RESPONSE_TOO_LARGE',
        details: { maxResponseBytes: error.maxBytes },
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
