import * as Comlink from 'comlink'
import { isDecoderWorkerError } from '../types/decoder-worker'
import type { DecoderWorkerApi } from '../types/decoder-worker'
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
  const worker = new Worker(
    new URL('../workers/decoder.worker.ts', import.meta.url),
    { type: 'module' },
  )
  const decoder = Comlink.wrap<DecoderWorkerApi>(worker)

  try {
    const result = await decoder.decodeScVal({ xdr: xdrString })

    if (isDecoderWorkerError(result)) {
      const errorMsg = result.message || 'Unknown decoder worker error'
      throw new Error(`Decode failed: ${errorMsg}`)
    }

    return result
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error(`Unexpected error during ScVal decoding: ${String(err)}`)
  } finally {
    worker.terminate()
  }
}
