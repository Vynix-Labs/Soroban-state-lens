/**
 * Constructs a JSON-RPC 2.0 request payload.
 *
 * @param method - The RPC method name to call. Must be a non-empty string.
 * @param params - The parameters for the RPC call (can be an array, object, or other values).
 * @param id - A unique identifier for the request.
 * @returns A strictly typed JSON-RPC 2.0 request object.
 * @throws Error if the method name is empty.
 */
export function buildJsonRpcRequest(
  method: string,
  params: unknown,
  id: number,
): { jsonrpc: '2.0'; method: string; params: unknown; id: number } {
  if (!method || method.trim().length === 0) {
    throw new Error('JSON-RPC method name cannot be empty')
  }

  return {
    jsonrpc: '2.0',
    method,
    params,
    id,
  }
}
