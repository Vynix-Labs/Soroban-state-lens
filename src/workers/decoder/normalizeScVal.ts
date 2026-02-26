import { Address, xdr } from '@stellar/stellar-sdk'
import { VisitedTracker, createVisitedTracker } from './guards'
import type {
  NormalizedAddress,
  NormalizedError,
  NormalizedMapEntry,
  NormalizedUnsupported,
  NormalizedValue,
  TruncatedMarker,
  UnsupportedFallback,
} from '../../types/normalized'

// Re-export guards for external use
export { VisitedTracker, createVisitedTracker }

// Re-export normalized types so consumers can import from a single location
export type { NormalizedError, NormalizedMapEntry, NormalizedValue, TruncatedMarker, UnsupportedFallback }

/**
 * ScVal normalization utilities for Soroban State Lens
 * Handles conversion of Stellar Contract Values to normalized JSON-like structures
 */

// ScVal variant types based on Stellar XDR definitions
export enum ScValType {
  SCV_BOOL = 'ScvBool',
  SCV_VOID = 'ScvVoid',
  SCV_U32 = 'ScvU32',
  SCV_I32 = 'ScvI32',
  SCV_U64 = 'ScvU64',
  SCV_I64 = 'ScvI64',
  SCV_TIMEPOINT = 'ScvTimepoint',
  SCV_DURATION = 'ScvDuration',
  SCV_U128 = 'ScvU128',
  SCV_I128 = 'ScvI128',
  SCV_U256 = 'ScvU256',
  SCV_I256 = 'ScvI256',
  SCV_BYTES = 'ScvBytes',
  SCV_STRING = 'ScvString',
  SCV_SYMBOL = 'ScvSymbol',
  SCV_ERROR = 'ScvError',
  SCV_VEC = 'ScvVec',
  SCV_MAP = 'ScvMap',
  SCV_ADDRESS = 'ScvAddress',
  SCV_CONTRACT_INSTANCE = 'ScvContractInstance',
  SCV_LEDGER_KEY_CONTRACT_INSTANCE = 'ScvLedgerKeyContractInstance',
  SCV_LEDGER_KEY_NONCE = 'ScvLedgerKeyNonce',
}

// Basic ScVal structure
export interface ScVal {
  switch: ScValType
  value?: unknown
}

function createUnsupportedFallback(
  variant: string,
  rawData: unknown,
): NormalizedUnsupported {
  return {
    kind: 'unsupported',
    variant,
    rawData: rawData === undefined ? null : rawData,
  }
}

/**
 * Options for normalizeScVal recursion limits.
 */
export interface NormalizeScValOptions {
  /** When set, nodes at this depth or deeper are replaced with a truncated marker. */
  maxDepth?: number
}

function createTruncatedMarker(depth: number): TruncatedMarker {
  return { __truncated: true, depth }
}

/**
 * Normalizes an ScVal to a JSON-serializable format
 * Supports i32, u32, and provides fallback for unsupported variants
 *
 * @param scVal - The ScVal to normalize
 * @param visited - Optional visited tracker for cycle detection
 * @param options - Optional limits (e.g. maxDepth)
 * @param currentDepth - Internal recursion depth; do not pass from caller
 * @returns Normalized value, with cycle or truncated markers when applicable
 */
export function normalizeScVal(
  scVal: ScVal | null | undefined,
  visited?: VisitedTracker,
  options?: NormalizeScValOptions,
  currentDepth?: number,
): any {
  const depth = currentDepth ?? 0

  if (
    options?.maxDepth !== undefined &&
    depth >= options.maxDepth
  ) {
    return createTruncatedMarker(depth)
  }

  // Initialize visited tracker on first call
  if (visited === undefined) {
    visited = createVisitedTracker()
  }

  if (scVal && typeof scVal === 'object') {
    if (visited.hasVisited(scVal)) {
      return VisitedTracker.createCycleMarker(visited.getDepth())
    }
    visited.markVisited(scVal)
  }

  if (!scVal || typeof scVal.switch !== 'string') {
    return createUnsupportedFallback('Invalid', scVal)
  }

  switch (scVal.switch) {
    case ScValType.SCV_BOOL:
      return {
        kind: 'primitive',
        primitive: 'bool',
        value: typeof scVal.value === 'boolean' ? scVal.value : false,
      }

    case ScValType.SCV_VOID:
      return {
        kind: 'primitive',
        primitive: 'void',
        value: null,
      }

    case ScValType.SCV_U32:
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= 0 &&
        scVal.value <= 0xffffffff
      ) {
        return {
          kind: 'primitive',
          primitive: 'u32',
          value: scVal.value,
        }
      }
      return createUnsupportedFallback(ScValType.SCV_U32, scVal.value)

    case ScValType.SCV_I32:
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= -0x80000000 &&
        scVal.value <= 0x7fffffff
      ) {
        return {
          kind: 'primitive',
          primitive: 'i32',
          value: scVal.value,
        }
      }
      return createUnsupportedFallback(ScValType.SCV_I32, scVal.value)

    case ScValType.SCV_STRING:
      return {
        kind: 'primitive',
        primitive: 'string',
        value: typeof scVal.value === 'string' ? scVal.value : '',
      }

    case ScValType.SCV_SYMBOL:
      return {
        kind: 'primitive',
        primitive: 'symbol',
        value: typeof scVal.value === 'string' ? scVal.value : '',
      }

    case ScValType.SCV_ERROR: {
      // ScvError carries { type: string, code: number } in the simple model
      const raw = scVal.value
      if (
        raw !== null &&
        raw !== undefined &&
        typeof raw === 'object' &&
        'type' in (raw) &&
        'code' in (raw)
      ) {
        const err = raw as { type: unknown; code: unknown }
        return {
          __error: true,
          type: String(err.type),
          code: Number(err.code),
        } satisfies NormalizedError
      }
      // Malformed error value – return a safe default
      return {
        __error: true,
        type: 'unknown',
        code: 0,
      } satisfies NormalizedError
    }

    case ScValType.SCV_VEC:
      if (Array.isArray(scVal.value)) {
        return {
          kind: 'vec',
          items: scVal.value.map((item) => normalizeScVal(item, visited, options, depth + 1)),
        }
      }
      return {
        kind: 'vec',
        items: [],
      }

    default:
      return createUnsupportedFallback(scVal.switch, scVal.value)
  }
}

export type { NormalizedAddress } from '../../types/normalized'

export function normalizeScAddress(
  scVal: any | null | undefined,
): NormalizedAddress | null {
  if (!scVal) {
    return null
  }

  if (scVal.switch().value !== xdr.ScValType.scvAddress().value) {
    return null
  }

  const address = Address.fromScVal(scVal)
  const value = address.toString()

  let addressType: any
  const prefix = value[0]

  switch (prefix) {
    case 'G':
      addressType = 'account'
      break
    case 'C':
      addressType = 'contract'
      break
    case 'M':
      addressType = 'muxedAccount'
      break
    case 'B':
      addressType = 'claimableBalance'
      break
    case 'P':
      addressType = 'liquidityPool'
      break
    default:
      addressType = 'unknown'
  }

  return {
    kind: 'address',
    addressType,
    value,
  }
}
