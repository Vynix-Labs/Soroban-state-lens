import * as Comlink from 'comlink'

import {
  normalizeScAddress,
  normalizeScVal,
} from './decoder/normalizeScVal'
import type {
  DecoderWorkerApi,
  DecoderWorkerError,
  NormalizeRequest,
  NormalizeResult,
  PingResponse,
} from '../types/decoder-worker'

/**
 * Implements the typed decoder worker API.
 * All methods conform to the DecoderWorkerApi contract defined in types/decoder-worker.ts
 */
const decoderWorkerApi: DecoderWorkerApi = {
  ping(): Promise<PingResponse> {
    return Promise.resolve({ status: 'pong' })
  },

  normalize(request: NormalizeRequest): Promise<NormalizeResult> {
    try {
      const { scVal, asAddress = false } = request

      // Normalize as address if requested and applicable
      if (asAddress) {
        const normalizedAddress = normalizeScAddress(scVal)
        return Promise.resolve({
          type: 'address',
          value: normalizedAddress,
        })
      }

      // Default: normalize as value
      const normalizedValue = normalizeScVal(scVal)
      return Promise.resolve({
        type: 'value',
        value: normalizedValue,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorDetails: Record<string, unknown> = {}

      if (error instanceof Error) {
        errorDetails.stack = error.stack
        errorDetails.name = error.name
      }

      const workerError: DecoderWorkerError = {
        code: 'NORMALIZE_FAILED',
        message: `Failed to normalize ScVal: ${errorMessage}`,
        details: errorDetails,
      }

      return Promise.resolve(workerError)
    }
  },
}

// Expose the fully typed API through Comlink
Comlink.expose(decoderWorkerApi)
