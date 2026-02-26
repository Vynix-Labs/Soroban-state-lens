import { classifyRpcHttpStatus } from './classifyRpcHttpStatus'

/**
 * Centralized retry decision logic for normalized RPC errors.
 *
 * This helper determines if an error is transient and should be retried.
 * - Retryable: Timeout, Network errors, 429 (Too Many Requests), 5xx (Server Errors),
 *   and specific JSON-RPC transient codes (-32603, -32000 to -32099).
 * - Non-retryable: Permanent client errors (other 4xx), malformed requests, etc.
 *
 * @param err - The normalized error object containing optional code or HTTP status.
 * @returns true if the error should be retried, false otherwise.
 */
export function shouldRetryRpcError(err: {
    code?: string | number
    status?: number
}): boolean {
    // 1. Handle HTTP status if present
    if (err.status !== undefined) {
        const classification = classifyRpcHttpStatus(err.status)
        if (classification === 'retryable') {
            return true
        }
        if (classification === 'fatal') {
            return false
        }
    }

    // 2. Handle specific codes
    if (err.code !== undefined) {
        const codeStr = String(err.code)

        // Transient environment/client-side conditions
        if (codeStr === 'TIMEOUT' || codeStr === 'NETWORK_ERROR') {
            return true
        }

        // JSON-RPC 2.0 transient error codes
        const codeNum = typeof err.code === 'number' ? err.code : parseInt(codeStr, 10)
        if (!isNaN(codeNum)) {
            if (codeNum === -32603) {
                return true
            }
            if (codeNum >= -32099 && codeNum <= -32000) {
                return true
            }
        }
    }

    // 3. Default to false for missing fields or unknown conditions
    return false
}
