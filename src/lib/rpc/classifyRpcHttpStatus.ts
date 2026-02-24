/**
 * Classifies HTTP status codes for RPC failures to determine the retry strategy.
 *
 * Classification Logic:
 * - 'retryable': Status code 429 (Too Many Requests) or 5xx (Server Errors).
 * - 'fatal': Status code 4xx (Client Errors) excluding 429.
 * - 'unknown': All other status codes, including non-integer or negative values.
 *
 * @param status The HTTP status code to classify.
 * @returns 'retryable', 'fatal', or 'unknown'.
 */
export function classifyRpcHttpStatus(
  status: number,
): 'retryable' | 'fatal' | 'unknown' {
  // Handle non-integer and negative values as unknown
  if (!Number.isInteger(status) || status < 0) {
    return 'unknown'
  }

  // 429 is retryable (rate limited)
  if (status === 429) {
    return 'retryable'
  }

  // 5xx are retryable (server errors)
  if (status >= 500 && status < 600) {
    return 'retryable'
  }

  // Other 4xx are fatal (client errors)
  if (status >= 400 && status < 500) {
    return 'fatal'
  }

  // All other cases (2xx, 1xx, 3xx) are unknown in the context of an RPC failure classification
  return 'unknown'
}
