import { Address, xdr } from '@stellar/stellar-sdk'
import { VisitedTracker, createVisitedTracker } from './guards'
import type { CycleMarker } from './guards'

// Re-export guards for external use
export { VisitedTracker, createVisitedTracker }
export type { CycleMarker }

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

// Fallback object for unsupported variants
export interface UnsupportedFallback {
  __unsupported: true
  variant: string
  rawData: unknown
}

// Normalized output types
export type NormalizedValue =
  | boolean
  | number
  | string
  | null
  | CycleMarker
  | UnsupportedFallback
  | Array<NormalizedValue>
  | { [key: string]: NormalizedValue }

/**
 * Creates a deterministic fallback object for unsupported ScVal variants
 */
function createUnsupportedFallback(
  variant: string,
  rawData: unknown,
): UnsupportedFallback {
  return {
    __unsupported: true,
    variant,
    rawData: rawData === undefined ? null : rawData,
  }
}

/**
 * Normalizes an ScVal to a JSON-serializable format
 * Supports i32, u32, and provides fallback for unsupported variants
 *
 * @param scVal - The ScVal to normalize
 * @param visited - Optional visited tracker for cycle detection
 * @returns Normalized value, with cycle markers for detected cycles
 */
export function normalizeScVal(
  scVal: ScVal | null | undefined,
  visited?: VisitedTracker,
): NormalizedValue {
  // Initialize visited tracker on first call
  if (visited === undefined) {
    visited = createVisitedTracker()
  }

  // Cycle detection: check if we've already started processing this object
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
      return typeof scVal.value === 'boolean' ? scVal.value : false

    case ScValType.SCV_VOID:
      return null

    case ScValType.SCV_U32:
      // Handle u32 - ensure it's a valid 32-bit unsigned integer
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= 0 &&
        scVal.value <= 0xffffffff
      ) {
        return scVal.value
      }
      return createUnsupportedFallback(ScValType.SCV_U32, scVal.value)

    case ScValType.SCV_I32:
      // Handle i32 - ensure it's a valid 32-bit signed integer
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= -0x80000000 &&
        scVal.value <= 0x7fffffff
      ) {
        return scVal.value
      }
      return createUnsupportedFallback(ScValType.SCV_I32, scVal.value)

    case ScValType.SCV_STRING:
      return typeof scVal.value === 'string' ? scVal.value : ''

    case ScValType.SCV_SYMBOL:
      return typeof scVal.value === 'string' ? scVal.value : ''

    case ScValType.SCV_VEC:
      // Handle vectors with recursive normalization and cycle detection
      if (Array.isArray(scVal.value)) {
        // Recursively normalize each item while preserving order

        // Pass visited tracker to detect cycles in nested structures
        return scVal.value.map((item) => normalizeScVal(item, visited))
      }
      return []

    // All other variants return unsupported fallback
    default:
      return createUnsupportedFallback(scVal.switch, scVal.value)
  }
} // @ts-ignore - resolved at runtime via application bundler
// @ts-ignore - module is provided by the runtime bundle

export type NormalizedAddressType =
  | 'account'
  | 'contract'
  | 'muxedAccount'
  | 'claimableBalance'
  | 'liquidityPool'
  | 'unknown'

export interface NormalizedAddress {
  type: 'address'
  addressType: NormalizedAddressType
  value: string
}

/**
 * Normalize an `xdr.ScVal` that represents an `ScAddress` into a
 * human-readable StrKey form.
 *
 * For non-address values, this returns `null`.
 */
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

  // Infer the address type from the StrKey prefix.
  // G... = ed25519 account, C... = contract, M... = muxed account,
  // B... = claimable balance, P... = liquidity pool.
  let addressType: NormalizedAddressType
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
    type: 'address',
    addressType,
    value,
  }
}
