import * as Comlink from 'comlink'
import { xdr } from '@stellar/stellar-sdk'
import { normalizeScAddress, normalizeScVal } from './decoder/normalizeScVal'
import { ScValType, normalizeNode } from './decoder/normalizeNode'
import type {
  DecodeScValRequest,
  DecodeScValResult,
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
export const decoderWorkerApi: DecoderWorkerApi = {
  ping(): Promise<PingResponse> {
    return Promise.resolve({ status: 'pong' })
  },

  normalize(request: NormalizeRequest): Promise<NormalizeResult> {
    try {
      const { scVal, asAddress = false, maxDepth } = request

      // Normalize as address if requested and applicable
      if (asAddress) {
        const normalizedAddress = normalizeScAddress(scVal)
        return Promise.resolve({
          type: 'address',
          value: normalizedAddress,
        })
      }

      // Default: normalize as value
      const normalizedValue = normalizeScVal(scVal, undefined, { maxDepth })
      return Promise.resolve({
        type: 'value',
        value: normalizedValue,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
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

  decodeScVal(request: DecodeScValRequest): Promise<DecodeScValResult> {
    try {
      const { xdr: xdrString } = request

      // Decode the ScVal from XDR
      const scValXdr = xdr.ScVal.fromXDR(xdrString, 'base64')

      // Map to the plain ScVal structure expected by normalizeNode.
      // For the simplified smoke method, we only support primitives.
      const rawSwitchName = scValXdr.switch().name
      // Normalize to PascalCase (e.g., scvBool -> ScvBool) to match ScValType enum
      const switchName = (rawSwitchName.charAt(0).toUpperCase() +
        rawSwitchName.slice(1)) as ScValType
      let value = scValXdr.value()

      // Ensure primitive values are in a format normalizeNode expects.
      // stellar-sdk's ScVal.value() returns Buffers for strings and symbols.
      if (
        (switchName === ScValType.SCV_STRING ||
          switchName === ScValType.SCV_SYMBOL) &&
        typeof value !== 'string' &&
        value &&
        typeof value.toString === 'function'
      ) {
        value = value.toString()
      }

      const plainScVal = {
        switch: switchName,
        value,
      }

      // Perform full node normalization
      const normalizedNode = normalizeNode(plainScVal)

      return Promise.resolve(normalizedNode)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const errorDetails: Record<string, unknown> = {}

      if (error instanceof Error) {
        errorDetails.stack = error.stack
        errorDetails.name = error.name
      }

      const workerError: DecoderWorkerError = {
        code: 'DECODE_FAILED',
        message: `Failed to decode ScVal XDR: ${errorMessage}`,
        details: errorDetails,
      }

      return Promise.resolve(workerError)
    }
  },
}

// Expose the fully typed API through Comlink
Comlink.expose(decoderWorkerApi)
