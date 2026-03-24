import { normalizeTimeoutMs } from '../lib/rpc/normalizeTimeoutMs'

/**
 * Races a worker ping against a timeout.
 * 
 * @param worker An object with a ping method returning a Promise.
 * @param timeoutMs The timeout in milliseconds.
 * @returns A promise that resolves to 'pong' or rejects with a timeout error.
 */
export async function withWorkerPingTimeout(
  worker: { ping: () => Promise<any> },
  timeoutMs: number
): Promise<'pong'> {
  const normalizedTimeout = normalizeTimeoutMs(timeoutMs)

  return new Promise<'pong'>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Worker ping timed out after ${normalizedTimeout}ms`))
    }, normalizedTimeout)

    worker
      .ping()
      .then(() => {
        clearTimeout(timer)
        resolve('pong')
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}
