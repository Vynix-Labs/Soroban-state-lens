/**
 * Typed contract between UI thread and decoder worker.
 * Provides strong typing for all worker request/response payloads and error handling.
 */

import type {
  NormalizedAddress,
  NormalizedValue,
  ScVal,
} from '../workers/decoder/normalizeScVal'

/**
 * Typed error object for predictable error handling in worker communication.
 * All errors returned from worker methods conform to this structure.
 */
export interface DecoderWorkerError {
  /** Machine-readable error code for error classification and handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Optional additional error details for debugging */
  details?: Record<string, unknown>
}

/**
 * Request payload for the ping method.
 * Currently empty but structured for future extensibility.
 */
export interface PingRequest {
  // Structured for potential future parameters
}

/**
 * Response payload for the ping method.
 */
export interface PingResponse {
  status: string
}

/**
 * Request payload for normalizing an ScVal.
 */
export interface NormalizeRequest {
  /** The ScVal to normalize */
  scVal: ScVal
  /** Optional flag to normalize as address type if applicable */
  asAddress?: boolean
}

/**
 * Successful response for normalize request containing normalized value.
 */
export interface NormalizeValueResponse {
  type: 'value'
  value: NormalizedValue
}

/**
 * Successful response for normalize request containing normalized address.
 */
export interface NormalizeAddressResponse {
  type: 'address'
  value: NormalizedAddress | null
}

/**
 * Union of possible successful normalize responses.
 */
export type NormalizeResponse = NormalizeValueResponse | NormalizeAddressResponse

/**
 * Result type for normalize method - either success or error.
 */
export type NormalizeResult = NormalizeResponse | DecoderWorkerError

/**
 * Defines the complete API contract for the decoder worker.
 * Both the worker and main thread wrapper must implement/use these signatures.
 */
export interface DecoderWorkerApi {
  /**
   * Health check method to verify worker is responsive.
   * @returns Promise resolving with 'pong' status
   * @throws DecoderWorkerError with code 'PING_FAILED' if worker is unresponsive
   */
  ping: () => Promise<PingResponse>

  /**
   * Normalizes an ScVal (Soroban Contract Value) to a JSON-serializable format.
   * Handles both regular values and address types with automatic detection.
   *
   * @param request - NormalizeRequest containing the ScVal to normalize
   * @returns Promise resolving to NormalizeResult (success response or error)
   * @throws Never throws; errors are returned in the NormalizeResult union
   *
   * @example
   * // Normalize a regular ScVal
   * const result = await worker.normalize({ scVal: myScVal });
   * if ('code' in result) {
   *   // Handle error
   *   console.error(result.message);
   * } else {
   *   console.log(result.value);
   * }
   *
   * @example
   * // Normalize as address
   * const result = await worker.normalize({
   *   scVal: myAddressScVal,
   *   asAddress: true
   * });
   */
  normalize: (request: NormalizeRequest) => Promise<NormalizeResult>
}

/**
 * Type guard to check if a result is a DecoderWorkerError.
 * Useful for error handling in consuming code.
 *
 * @param result - The result to check
 * @returns True if result is an error, false otherwise
 */
export function isDecoderWorkerError(
  result: NormalizeResult,
): result is DecoderWorkerError {
  return 'code' in result
}
