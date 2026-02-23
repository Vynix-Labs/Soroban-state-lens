import type { RpcConfig, RpcError } from './types';

export async function callRpc<T = unknown>(
  config: RpcConfig,
  body?: unknown
): Promise<T | RpcError> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status,
        details: errorText,
        isTimeout: false,
      };
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if ((error instanceof Error && error.name === 'AbortError') || 
        (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        message: 'Request timeout',
        code: 'TIMEOUT',
        details: `Request timed out after ${config.timeout}ms`,
        isTimeout: true,
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        details: error.message,
        isTimeout: false,
      };
    }

    return {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNKNOWN_ERROR',
      details: error,
      isTimeout: false,
    };
  }
}