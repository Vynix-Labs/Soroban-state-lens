import * as Comlink from 'comlink'

import type { DecoderWorkerApi } from '../types/decoder-worker'

/**
 * Creates and returns a typed remote worker for decoder operations.
 * The returned worker conforms to the DecoderWorkerApi contract.
 *
 * @returns A Comlink-wrapped remote worker typed to DecoderWorkerApi
 */
export function createDecoderWorker(): Comlink.Remote<DecoderWorkerApi> {
  const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), {
    type: 'module',
  })

  return Comlink.wrap<DecoderWorkerApi>(worker)
}
