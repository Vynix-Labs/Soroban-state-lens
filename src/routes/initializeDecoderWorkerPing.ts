import { createDecoderWorkerSafe } from '../workers/createDecoderWorkerSafe'

/**
 * Probe the decoder worker during startup and handle failures gracefully.
 * Any initialization or ping failure is caught and logged to avoid
 * unhandled rejections during app bootstrap.
 */
export async function probeDecoderWorker(): Promise<void> {
  try {
    const worker = await createDecoderWorkerSafe()
    // Attach rejection handler to the ping promise
    void worker.ping().catch((err) => {
      console.warn('[App] Decoder worker ping failed:', err)
    })
  } catch (err) {
    // Normalized initialization failure
    console.warn('[App] Decoder worker initialization failed:', err)
  }
}

export default probeDecoderWorker
