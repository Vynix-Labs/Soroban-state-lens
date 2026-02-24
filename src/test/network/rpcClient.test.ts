import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const result = await callRpc(defaultConfig)

    expect(result).toMatchObject({
      message: 'Invalid JSON',
      code: 'UNKNOWN_ERROR',
      isTimeout: false,
    })
  })
})
