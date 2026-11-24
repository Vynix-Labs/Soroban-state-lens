import { createDecoderWorkerSafe } from '../workers/createDecoderWorkerSafe'
import { withWorkerPingTimeout } from '../workers/withWorkerPingTimeout'

const DECODER_PING_TIMEOUT_MS = 5_000

/**
 * Probe the decoder worker during startup and handle failures gracefully.
 * Any initialization or ping failure is caught and logged to avoid
 * unhandled rejections during app bootstrap.
 */
export async function probeDecoderWorker(): Promise<void> {
  try {
    const worker = await createDecoderWorkerSafe()
    try {
      await withWorkerPingTimeout(worker, DECODER_PING_TIMEOUT_MS)
    } catch (err) {
      console.warn('[App] Decoder worker ping failed:', err)
    } finally {
      worker.terminate()
    }
  } catch (err) {
    // Normalized initialization failure
    console.warn('[App] Decoder worker initialization failed:', err)
  }
}

export default probeDecoderWorker
