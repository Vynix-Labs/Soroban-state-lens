/**
 * Narrow values to JSON-RPC 2.0 error responses.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid JSON-RPC 2.0 error response.
 */
export function isJsonRpcErrorResponse(value: unknown): value is {
  jsonrpc: '2.0'
  id: number | string | null
  error: { code: number; message: string; data?: unknown }
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

  // Must have error object
  if (typeof candidate.error !== 'object' || candidate.error === null) {
    return false
  }

  const error = candidate.error as Record<string, unknown>

  // error.code must be a number
  if (typeof error.code !== 'number') {
    return false
  }

  // error.message must be a non-empty string
  if (typeof error.message !== 'string' || error.message.trim().length === 0) {
    return false
  }

  // Reject success responses (should not have 'result')
  if ('result' in candidate) {
    return false
  }

  return true
}
