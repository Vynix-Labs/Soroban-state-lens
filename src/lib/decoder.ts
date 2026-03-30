import { createDecoderWorker } from '../workers/createDecoderWorker'
import { isDecoderWorkerError } from '../types/decoder-worker'
import type { Node } from '../types/node'

/**
 * A main-thread helper for decoding Soroban ScVal XDR.
 * This function abstracts the worker communication logic and provides a
 * simple, typed interface for UI components to decode XDR strings.
 *
 * @param xdrString - The base64-encoded ScVal XDR string to decode.
 * @returns A promise that resolves to a normalized Node structure.
 * @throws {Error} If decoding fails or if the worker returns an error result.
 */
export async function decodeScVal(xdrString: string): Promise<Node> {
  // Create a worker instance for the operation.
  // In this simplified implementation, we create a new worker for each call.
  const worker = createDecoderWorker()

  try {
    const result = await worker.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      // Handle worker-returned errors by wrapping them in a standard Error.
      const errorMsg = result.message || 'Unknown decoder worker error'
      throw new Error(`Decode failed: ${errorMsg}`)
    }

    return result
  } catch (err) {
    // Catch both Comlink/worker communication errors and worker-returned errors.
    if (err instanceof Error) {
      throw err
    }
    throw new Error(`Unexpected error during ScVal decoding: ${String(err)}`)
  }
}
