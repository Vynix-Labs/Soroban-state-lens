import * as Comlink from 'comlink'
import type { DecoderWorkerAPI } from './decoder.worker'

export function createDecoderWorker(): Comlink.Remote<DecoderWorkerAPI> {
  const worker = new Worker(new URL('./decoder.worker.ts', import.meta.url), {
    type: 'module',
  })

  return Comlink.wrap<DecoderWorkerAPI>(worker)
}
