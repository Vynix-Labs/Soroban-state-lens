import * as Comlink from 'comlink'
import { Address, xdr } from '@stellar/stellar-sdk'
import { limitDecoderErrorDetail } from '../types/decoder-worker'
import { normalizeScAddress, normalizeScVal } from './decoder/normalizeScVal'
import { normalizeNode } from './decoder/normalizeNode'
import type {
  DecodeScValRequest,
  DecodeScValResult,
  DecoderWorkerApi,
  DecoderWorkerError,
  NormalizeRequest,
  NormalizeResult,
  PingResponse,
} from '../types/decoder-worker'
import type { ScVal, ScValType } from './decoder/normalizeNode'

interface XdrUnionLike {
  switch: () => { name: string }
  value: () => unknown
}

interface XdrMapEntryLike {
  key: () => unknown
  val: () => unknown
}

interface XdrParts128Like {
  hi: () => unknown
  lo: () => unknown
}

interface XdrParts256Like extends XdrParts128Like {
  hiHi: () => unknown
  hiLo: () => unknown
  loHi: () => unknown
  loLo: () => unknown
}

function isXdrUnionLike(value: unknown): value is XdrUnionLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'switch' in value &&
    typeof value.switch === 'function' &&
    'value' in value &&
    typeof value.value === 'function'
  )
}

function isXdrMapEntryLike(value: unknown): value is XdrMapEntryLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    typeof value.key === 'function' &&
    'val' in value &&
    typeof value.val === 'function'
  )
}

function isXdrParts128Like(value: unknown): value is XdrParts128Like {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hi' in value &&
    typeof value.hi === 'function' &&
    'lo' in value &&
    typeof value.lo === 'function'
  )
}

function isXdrParts256Like(value: unknown): value is XdrParts256Like {
  return (
    isXdrParts128Like(value) &&
    'hiHi' in value &&
    typeof value.hiHi === 'function' &&
    'hiLo' in value &&
    typeof value.hiLo === 'function' &&
    'loHi' in value &&
    typeof value.loHi === 'function' &&
    'loLo' in value &&
    typeof value.loLo === 'function'
  )
}

function xdrIntegerToString(value: unknown): unknown {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    return value.toString()
  }
  return value
}

function normalizeSdkScVal(value: unknown): ScVal {
  if (!isXdrUnionLike(value)) {
    throw new Error('Expected an ScVal XDR union')
  }

  const rawSwitchName = value.switch().name
  const switchName = (rawSwitchName.charAt(0).toUpperCase() +
    rawSwitchName.slice(1)) as ScValType
  const rawValue = value.value()
  let plainValue: unknown = rawValue

  switch (rawSwitchName) {
    case 'scvVec':
      plainValue =
        rawValue == null
          ? rawValue
          : Array.isArray(rawValue)
            ? rawValue.map(normalizeSdkScVal)
            : rawValue
      break
    case 'scvMap':
      plainValue =
        rawValue == null
          ? rawValue
          : Array.isArray(rawValue)
            ? rawValue.map((entry) => {
                if (!isXdrMapEntryLike(entry)) {
                  throw new Error('Expected an ScMapEntry XDR value')
                }
                return {
                  key: normalizeSdkScVal(entry.key()),
                  val: normalizeSdkScVal(entry.val()),
                }
              })
            : rawValue
      break
    case 'scvString':
    case 'scvSymbol':
      plainValue =
        rawValue !== null &&
        rawValue !== undefined &&
        typeof rawValue === 'object' &&
        'toString' in rawValue &&
        typeof rawValue.toString === 'function'
          ? rawValue.toString()
          : rawValue
      break
    case 'scvAddress':
      plainValue = Address.fromScVal(
        value as ReturnType<typeof xdr.ScVal.fromXDR>,
      ).toString()
      break
    case 'scvU64':
    case 'scvI64':
    case 'scvTimepoint':
    case 'scvDuration':
      plainValue = xdrIntegerToString(rawValue)
      break
    case 'scvU128':
    case 'scvI128':
      if (isXdrParts128Like(rawValue)) {
        plainValue = {
          hi: xdrIntegerToString(rawValue.hi()),
          lo: xdrIntegerToString(rawValue.lo()),
        }
      }
      break
    case 'scvU256':
    case 'scvI256':
      if (isXdrParts256Like(rawValue)) {
        plainValue = {
          hiHi: xdrIntegerToString(rawValue.hiHi()),
          hiLo: xdrIntegerToString(rawValue.hiLo()),
          loHi: xdrIntegerToString(rawValue.loHi()),
          loLo: xdrIntegerToString(rawValue.loLo()),
        }
      }
      break
    case 'scvError':
      if (isXdrUnionLike(rawValue)) {
        plainValue = {
          type: rawValue.switch().name,
          code: rawValue.value(),
        }
      }
      break
  }

  return { switch: switchName, value: plainValue }
}

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
          ? limitDecoderErrorDetail(error.stack)
          : undefined
        errorDetails.name = limitDecoderErrorDetail(error.name)
      }

      const workerError: DecoderWorkerError = {
        code: 'NORMALIZE_FAILED',
        message: limitDecoderErrorDetail(
          `Failed to normalize ScVal: ${errorMessage}`,
        ),
        details: errorDetails,
      }

      return Promise.resolve(workerError)
    }
  },

  decodeScVal(request: DecodeScValRequest): Promise<DecodeScValResult> {
    try {
      const { xdr: xdrString, maxDepth } = request

      // Decode the XDR into plain data before normalization so nested SDK
      // objects never cross the worker boundary.
      const scValXdr = xdr.ScVal.fromXDR(xdrString, 'base64')

      // Convert SDK XDR unions and containers to the plain shape normalizeNode expects.
      const plainScVal = normalizeSdkScVal(scValXdr)

      // Perform full node normalization with optional depth limiting
      const normalizedNode = normalizeNode(plainScVal, undefined, undefined, {
        maxDepth,
      })

      return Promise.resolve(normalizedNode)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      const errorDetails: Record<string, unknown> = {}

      if (error instanceof Error) {
        errorDetails.stack = error.stack
          ? limitDecoderErrorDetail(error.stack)
          : undefined
        errorDetails.name = limitDecoderErrorDetail(error.name)
      }

      const workerError: DecoderWorkerError = {
        code: 'DECODE_FAILED',
        message: limitDecoderErrorDetail(
          `Failed to decode ScVal XDR: ${errorMessage}`,
        ),
        details: errorDetails,
      }

      return Promise.resolve(workerError)
    }
  },
}

// Expose the fully typed API through Comlink
Comlink.expose(decoderWorkerApi)
