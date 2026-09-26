/**
 * Narrow values to JSON-RPC 2.0 success responses.
 *
 * @param value - The value to check.
 * @param expectedId - When provided, the response `id` must equal this value.
 * @returns True if the value is a valid JSON-RPC 2.0 success response and,
 *   when `expectedId` is supplied, the response id matches the request id.
 */
export function isJsonRpcSuccessResponse(
  value: unknown,
  expectedId?: number | string,
): value is {
  jsonrpc: '2.0'
  id: number | string | null
  result: unknown
} {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  // Must have jsonrpc: '2.0'
  if (candidate.jsonrpc !== '2.0') {
    return false
  }

  // Must have a valid id: number | string | null
  const idValid =
    typeof candidate.id === 'string' ||
    typeof candidate.id === 'number' ||
    candidate.id === null
  if (!idValid) {
    return false
  }

  // Must have result field
  if (!('result' in candidate)) {
    return false
  }

  // Reject error responses (should not have 'error')
  if ('error' in candidate) {
    return false
  }

  // When a request ID is provided, the response ID must match exactly.
  if (expectedId !== undefined && candidate.id !== expectedId) {
    return false
  }

  return true
}
