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
  | UnsupportedFallback
  | Array<NormalizedValue>
  | { [key: string]: NormalizedValue }

/**
 * Creates a deterministic fallback object for unsupported ScVal variants
 */
function createUnsupportedFallback(variant: string, rawData: unknown): UnsupportedFallback {
  return {
    __unsupported: true,
    variant,
    rawData: rawData === undefined ? null : rawData,
  }
}

/**
 * Normalizes an ScVal to a JSON-serializable format
 * Supports i32, u32, and provides fallback for unsupported variants
 */
export function normalizeScVal(scVal: ScVal | null | undefined): NormalizedValue {
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
      if (typeof scVal.value === 'number' && Number.isInteger(scVal.value) && scVal.value >= 0 && scVal.value <= 0xFFFFFFFF) {
        return scVal.value
      }
      return createUnsupportedFallback(ScValType.SCV_U32, scVal.value)

    case ScValType.SCV_I32:
      // Handle i32 - ensure it's a valid 32-bit signed integer
      if (typeof scVal.value === 'number' && Number.isInteger(scVal.value) && scVal.value >= -0x80000000 && scVal.value <= 0x7FFFFFFF) {
        return scVal.value
      }
      return createUnsupportedFallback(ScValType.SCV_I32, scVal.value)

    case ScValType.SCV_STRING:
      return typeof scVal.value === 'string' ? scVal.value : ''

    case ScValType.SCV_SYMBOL:
      return typeof scVal.value === 'string' ? scVal.value : ''

    // All other variants return unsupported fallback
    default:
      return createUnsupportedFallback(scVal.switch, scVal.value)
  }
}