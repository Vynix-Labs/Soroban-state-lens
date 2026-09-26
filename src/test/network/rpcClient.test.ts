import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callRpc } from '../../lib/network/rpcClient'
import type { RpcConfig } from '../../lib/network/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('callRpc', () => {
  const defaultConfig: RpcConfig = {
    url: 'https://api.example.com/rpc',
    timeout: 5000,
    headers: { 'X-Custom': 'test' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should handle successful responses', async () => {
    const mockData = { result: 'success', id: 123 }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc<typeof mockData>(defaultConfig, {
      method: 'test',
    })

    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(defaultConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'test',
      },
      body: JSON.stringify({ method: 'test' }),
      signal: expect.any(AbortSignal),
    })
  })

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Resource not found'),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'HTTP 404: Not Found',
      code: 404,
      details: 'Resource not found',
      isTimeout: false,
    })
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Network error',
      code: 'NETWORK_ERROR',
      details: 'Failed to fetch',
      isTimeout: false,
    })
  })

  it('should handle timeout errors', async () => {
    mockFetch.mockRejectedValueOnce(
      new DOMException('The operation was aborted.', 'AbortError'),
    )

    const result = await callRpc({ ...defaultConfig, timeout: 1000 })

    expect(result).toMatchObject({
      message: 'Request timeout',
      code: 'TIMEOUT',
      details: 'Request timed out after 1000ms',
      isTimeout: true,
    })
  })

  it.each([
    { input: 0, expected: 10000 },
    { input: -123, expected: 10000 },
    { input: 1.9, expected: 1 },
    { input: Number.NaN, expected: 10000 },
    { input: Number.POSITIVE_INFINITY, expected: 10000 },
  ])(
    'normalizes timeout $input to $expected before scheduling the abort timer',
    async ({ input, expected }) => {
      vi.useFakeTimers()
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      mockFetch.mockRejectedValueOnce(
        new DOMException('The operation was aborted.', 'AbortError'),
      )

      const result = await callRpc({ ...defaultConfig, timeout: input })

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), expected)
      expect(result).toMatchObject({
        message: 'Request timeout',
        code: 'TIMEOUT',
        details: `Request timed out after ${expected}ms`,
        isTimeout: true,
      })
    },
  )

  it('should work without body parameter', async () => {
    const mockData = { status: 'ok' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(defaultConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'test',
      },
      body: undefined,
      signal: expect.any(AbortSignal),
    })
  })

  it('should work without optional headers', async () => {
    const configWithoutHeaders: RpcConfig = {
      url: 'https://api.example.com/rpc',
      timeout: 5000,
    }

    const mockData = { result: 'success' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc(configWithoutHeaders)

    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(configWithoutHeaders.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: undefined,
      signal: expect.any(AbortSignal),
    })
  })

  it('should ignore caller Content-Type that is incompatible', async () => {
    const configWithBadContentType: RpcConfig = {
      url: 'https://api.example.com/rpc',
      timeout: 5000,
      headers: { 'Content-Type': 'text/plain', 'X-Custom': 'test' },
    }

    const mockData = { result: 'ok' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc(configWithBadContentType)

    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(configWithBadContentType.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'test',
      },
      body: undefined,
      signal: expect.any(AbortSignal),
    })
  })

  it('should ignore caller Content-Type regardless of casing', async () => {
    const configWithLowercaseContentType: RpcConfig = {
      url: 'https://api.example.com/rpc',
      timeout: 5000,
      headers: { 'content-type': 'text/plain', 'X-Custom': 'test' } as any,
    }

    const mockData = { result: 'ok' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc(configWithLowercaseContentType)

    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      configWithLowercaseContentType.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'test',
        },
        body: undefined,
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('aborts the in-flight request when a caller signal aborts', async () => {
    const caller = new AbortController()
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          caller.signal.addEventListener('abort', () =>
            reject(
              new DOMException('The operation was aborted.', 'AbortError'),
            ),
          )
        }),
    )

    const abortPromise = callRpc(
      { ...defaultConfig, signal: caller.signal },
      { method: 'test' },
    )
    caller.abort()
    const result = await abortPromise

    expect(result).toMatchObject({
      message: 'Request aborted',
      code: 'ABORTED',
      isTimeout: false,
    })
  })

  it('returns an aborted shape when the caller signal is already aborted', async () => {
    const caller = new AbortController()
    caller.abort()
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(
        new DOMException('The operation was aborted.', 'AbortError'),
      ),
    )

    const result = await callRpc(
      { ...defaultConfig, signal: caller.signal },
      { method: 'test' },
    )

    expect(result).toMatchObject({
      message: 'Request aborted',
      code: 'ABORTED',
      isTimeout: false,
    })
  })

  it('still uses the internal timeout when no caller signal is provided', async () => {
    mockFetch.mockRejectedValueOnce(
      new DOMException('The operation was aborted.', 'AbortError'),
    )

    const result = await callRpc({ ...defaultConfig, timeout: 1000 })

    expect(result).toMatchObject({
      message: 'Request timeout',
      code: 'TIMEOUT',
      details: 'Request timed out after 1000ms',
      isTimeout: true,
    })
  })

  it('maps JSON parsing failures to a structured INVALID_JSON error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.reject(
          new SyntaxError('Unexpected token < in JSON at position 0'),
        ),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Invalid JSON response',
      code: 'INVALID_JSON',
      details: 'Unexpected token < in JSON at position 0',
      isTimeout: false,
    })
  })

  it('rejects a streamed response after the configured byte limit', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"result":"'))
        controller.enqueue(new TextEncoder().encode('too-large"}'))
        controller.close()
      },
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      body,
    })

    const result = await callRpc(
      { ...defaultConfig, maxResponseBytes: 10 },
      { method: 'test' },
    )

    expect(result).toMatchObject({
      message: 'RPC response exceeds maximum size of 10 bytes',
      code: 'RESPONSE_TOO_LARGE',
      details: { maxResponseBytes: 10 },
      isTimeout: false,
    })
  })
  it('should treat an empty 200 response body as an invalid RPC response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      clone: function (this: unknown) {
        return this
      },
      text: () => Promise.resolve(''),
      json: () => Promise.reject(new Error('Unexpected end of JSON input')),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Empty RPC response body',
      code: 'INVALID_RESPONSE',
      details: 'Received HTTP 200 with an empty response body',
      isTimeout: false,
    })
  })

  it('should treat a 204 No Content response as an invalid RPC response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      clone: function (this: unknown) {
        return this
      },
      text: () => Promise.resolve(''),
      json: () => Promise.reject(new Error('Unexpected end of JSON input')),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Empty RPC response body',
      code: 'INVALID_RESPONSE',
      details: 'Received HTTP 204 with an empty response body',
      isTimeout: false,
    })
  })

  it('should treat a whitespace-only body as an invalid RPC response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      clone: function (this: unknown) {
        return this
      },
      text: () => Promise.resolve('   \n  '),
      json: () => Promise.reject(new Error('Unexpected end of JSON input')),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Empty RPC response body',
      code: 'INVALID_RESPONSE',
    })
  })

  it('should still parse a valid non-empty JSON body when clone/text succeed', async () => {
    const mockData = { result: 'success' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      clone: function (this: unknown) {
        return this
      },
      text: () => Promise.resolve(JSON.stringify(mockData)),
      json: () => Promise.resolve(mockData),
    })

    const result = await callRpc<typeof mockData>(defaultConfig)

    expect(result).toEqual(mockData)
  })

  it('should timeout while waiting for response.json()', async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementationOnce((_url, init) =>
      Promise.resolve({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(
                new DOMException('The operation was aborted.', 'AbortError'),
              ),
            )
          }),
      } as unknown as Response),
    )

    const promise = callRpc({ ...defaultConfig, timeout: 1000 })
    await vi.runAllTimersAsync()

    const result = await promise
    expect(result).toMatchObject({
      message: 'Request timeout',
      code: 'TIMEOUT',
      isTimeout: true,
    })
    vi.useRealTimers()
  })
})
