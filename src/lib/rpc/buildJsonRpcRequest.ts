/**
 * Constructs a JSON-RPC 2.0 request payload.
 *
 * @param method - The RPC method name to call. Must be a non-empty string.
 * @param params - The parameters for the RPC call (can be an array, object, or other values).
 * @param id - A unique identifier for the request.
 * @returns A strictly typed JSON-RPC 2.0 request object.
 * @throws Error if the method name is empty or the request ID is invalid.
 */
export function buildJsonRpcRequest(
  method: string,
  params: unknown,
  id: number,
): { jsonrpc: '2.0'; method: string; params: unknown; id: number } {
  const normalized = typeof method === 'string' ? method.trim() : ''

  if (normalized.length === 0) {
    throw new Error('JSON-RPC method name cannot be empty')
  }

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('JSON-RPC request ID must be a finite positive integer')
  }

  return {
    jsonrpc: '2.0',
    method: normalized,
    params,
    id,
  }
}
