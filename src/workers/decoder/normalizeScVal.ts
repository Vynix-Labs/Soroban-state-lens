import { Address, xdr } from '@stellar/stellar-sdk'
import { bytesToHex, isUint8Array } from '../../lib/format/bytesToHex'
import { VisitedTracker, createVisitedTracker } from './guards'
import type {
  CycleMarker,
  NormalizedAddress,
  NormalizedError,
  NormalizedMap,
  NormalizedMapEntry,
  NormalizedPrimitive,
  NormalizedUnsupported,
  NormalizedVec,
  TruncatedMarker,
  UnsupportedFallback,
} from '../../types/normalized'

// Re-export guards for external use
export { VisitedTracker, createVisitedTracker }

// Re-export normalized types so consumers can import from a single location
export type {
  NormalizedError,
  NormalizedMapEntry,
  TruncatedMarker,
  UnsupportedFallback,
}

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

/**
 * A single entry in a normalized map, preserving the original key as a
 * normalized value so that complex (non-string) keys are not lost.
 */
export interface MapEntry {
  key: NormalizedValue
  value: NormalizedValue
}

// Normalized output types
export type NormalizedValue =
  | boolean
  | number
  | string
  | null
  | CycleMarker
  | TruncatedMarker
  | NormalizedError
  | NormalizedUnsupported
  | NormalizedPrimitive
  | NormalizedVec
  | NormalizedMap
  | MapEntry
  | Array<NormalizedValue>
  | { [key: string]: NormalizedValue }

/**
 * Creates a deterministic fallback object for unsupported ScVal variants
 */
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
 * Attempts to convert a BigInt-like value (BigInt, Hyper/UnsignedHyper with
 * toString, or numeric string) to a decimal string. Returns null on failure.
 */
function bigIntLikeToString(value: unknown): string | null {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'toString' in value &&
    typeof (value as any).toString === 'function'
  ) {
    const str = (value as any).toString()
    if (typeof str === 'string' && /^-?\d+$/.test(str)) {
      return str
    }
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return value
  }
  return null
}

/**
 * Converts a 128-bit value with hi/lo parts to a decimal string.
 * For unsigned: (hi << 64) | lo
 * For signed: hi is treated as a signed 64-bit integer.
 * Returns null if the value cannot be parsed.
 */
function parts128ToString(value: unknown, signed: boolean): string | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null
  }

  // Support both method-style (SDK objects) and property-style (plain objects)
  const v = value as any
  const hiRaw = typeof v.hi === 'function' ? v.hi() : v.hi
  const loRaw = typeof v.lo === 'function' ? v.lo() : v.lo

  const hiStr = bigIntLikeToString(hiRaw)
  const loStr = bigIntLikeToString(loRaw)

  if (hiStr === null || loStr === null) {
    return null
  }

  const hi = BigInt(hiStr)
  const lo = BigInt(loStr)

  // lo is always treated as unsigned 64-bit
  const uLo = lo < 0n ? lo + (1n << 64n) : lo

  if (signed) {
    // hi is signed 64-bit; combined = hi * 2^64 + uLo
    const combined = hi * (1n << 64n) + uLo
    const min = -(1n << 127n)
    const max = (1n << 127n) - 1n
    if (combined < min || combined > max) {
      return null
    }
    return combined.toString()
  } else {
    // Both parts treated as unsigned
    const uHi = hi < 0n ? hi + (1n << 64n) : hi
    const combined = uHi * (1n << 64n) + uLo
    const max = (1n << 128n) - 1n
    if (combined < 0n || combined > max) {
      return null
    }
    return combined.toString()
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

/** Sensible default for maximum recursion depth in normalization. */
export const MAX_DEPTH_DEFAULT = 32

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
  const maxDepth = options?.maxDepth ?? MAX_DEPTH_DEFAULT

  if (depth >= maxDepth) {
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

  // Handle null/undefined first
  if (!scVal) {
    return createUnsupportedFallback('Invalid', scVal)
  }

  // Handle XDR ScVal objects where switch is an enum
  let switchValue: string
  if (typeof scVal.switch === 'string') {
    switchValue = scVal.switch
  } else if (typeof scVal.switch === 'function') {
    // XDR objects have switch() method that returns an enum
    try {
      const switchEnum = (scVal.switch as () => any)()
      if (
        switchEnum &&
        typeof switchEnum === 'object' &&
        'name' in switchEnum
      ) {
        // Convert XDR enum name (e.g., "scvAddress") to enum value (e.g., "ScvAddress")
        const xdrName = switchEnum.name
        switchValue = xdrName.charAt(0).toUpperCase() + xdrName.slice(1)
      } else {
        return createUnsupportedFallback('Invalid', scVal)
      }
    } catch {
      return createUnsupportedFallback('Invalid', scVal)
    }
  } else {
    return createUnsupportedFallback('Invalid', scVal)
  }

  switch (switchValue) {
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

    case ScValType.SCV_U64: {
      const str = bigIntLikeToString(scVal.value)
      if (str !== null) {
        const n = BigInt(str)
        if (n >= 0n && n <= 0xffffffffffffffffn) {
          return { kind: 'primitive', primitive: 'u64', value: str }
        }
      }
      return createUnsupportedFallback(ScValType.SCV_U64, scVal.value)
    }

    case ScValType.SCV_I64: {
      const str = bigIntLikeToString(scVal.value)
      if (str !== null) {
        const n = BigInt(str)
        if (n >= -0x8000000000000000n && n <= 0x7fffffffffffffffn) {
          return { kind: 'primitive', primitive: 'i64', value: str }
        }
      }
      return createUnsupportedFallback(ScValType.SCV_I64, scVal.value)
    }

    case ScValType.SCV_U128: {
      const str = parts128ToString(scVal.value, false)
      if (str !== null) {
        return { kind: 'primitive', primitive: 'u128', value: str }
      }
      return createUnsupportedFallback(ScValType.SCV_U128, scVal.value)
    }

    case ScValType.SCV_I128: {
      const str = parts128ToString(scVal.value, true)
      if (str !== null) {
        return { kind: 'primitive', primitive: 'i128', value: str }
      }
      return createUnsupportedFallback(ScValType.SCV_I128, scVal.value)
    }

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

    case ScValType.SCV_BYTES:
      return {
        kind: 'primitive',
        primitive: 'bytes',
        value: isUint8Array(scVal.value) ? bytesToHex(scVal.value) : '0x',
      }

    case ScValType.SCV_ERROR: {
      // ScvError carries { type: string, code: number } in the simple model
      const raw = scVal.value
      if (
        raw !== null &&
        raw !== undefined &&
        typeof raw === 'object' &&
        'type' in raw &&
        'code' in raw
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
          items: scVal.value.map((item) =>
            normalizeScVal(item, visited, options, depth + 1),
          ),
        }
      }
      return {
        kind: 'vec',
        items: [],
      }

    case ScValType.SCV_MAP:
      // Map keys in Soroban can be complex objects, so we preserve them as
      // explicit key/value pairs in a normalized map structure.
      if (Array.isArray(scVal.value)) {
        return {
          kind: 'map',
          entries: scVal.value.map(
            (entry: { key: ScVal; val: ScVal }): NormalizedMapEntry => ({
              key: normalizeScVal(entry.key, visited, options, depth + 1),
              value: normalizeScVal(entry.val, visited, options, depth + 1),
            }),
          ),
        }
      }
      // null/undefined value means an empty map
      if (scVal.value == null) {
        return {
          kind: 'map',
          entries: [],
        }
      }
      return createUnsupportedFallback(ScValType.SCV_MAP, scVal.value)

    case ScValType.SCV_ADDRESS:
      return normalizeScAddress(scVal)

    // All other variants return unsupported fallback
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
