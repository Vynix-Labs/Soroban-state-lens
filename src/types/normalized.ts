/**
 * Normalized value union types for Soroban State Lens
 *
 * This module defines the canonical output shapes produced by the decoder.
 * All normalized decoder outputs must be expressible as one of the variants
 * in NormalizedValue. UI rendering and serialization consume these types.
 *
 * Discriminant conventions:
 *   __cycle      → CycleMarker        (cycle detected during traversal)
 *   __truncated  → TruncatedMarker    (max depth reached during traversal)
 *   __error      → NormalizedError    (ScVal error variant)
 *   __unsupported → UnsupportedFallback (unrecognised or unimplemented variant)
 */

// ---------------------------------------------------------------------------
// CycleMarker
// ---------------------------------------------------------------------------

/**
 * Returned in place of a value when the normalizer detects a cyclic reference.
 */
export interface CycleMarker {
  __cycle: true
  depth?: number
}

// ---------------------------------------------------------------------------
// TruncatedMarker
// ---------------------------------------------------------------------------

/**
 * Returned in place of a value when normalization hits the configured max depth.
 */
export interface TruncatedMarker {
  __truncated: true
  depth?: number
}

// ---------------------------------------------------------------------------
// NormalizedError
// ---------------------------------------------------------------------------

/**
 * Represents a normalized `ScvError` Soroban contract value.
 *
 * The `type` field corresponds to the ScErrorType name (e.g. "contract",
 * "wasm_vm", "storage", …) and `code` is the raw numeric error code from
 * ScErrorCode.
 */
export interface NormalizedError {
  __error: true
  type: string
  code: number
}

// ---------------------------------------------------------------------------
// UnsupportedFallback
// ---------------------------------------------------------------------------

/**
 * Stable, deterministic fallback returned for ScVal variants that are not yet
 * decoded.  The object is always JSON-serializable.
 */
export interface UnsupportedFallback {
  __unsupported: true
  /** The ScVal switch name, e.g. "ScvU64". */
  variant: string
  /** Raw payload from the original ScVal, or null when absent. */
  rawData: unknown
}

// ---------------------------------------------------------------------------
// NormalizedMapEntry
// ---------------------------------------------------------------------------

/**
 * A single key/value pair inside a normalized map.
 * Represented as a pair rather than a plain JS object so that non-string
 * keys (addresses, tuples, etc.) are preserved without loss.
 */
export interface NormalizedMapEntry {
  key: NormalizedValue
  value: NormalizedValue
}

// ---------------------------------------------------------------------------
// NormalizedValue – the top-level union
// ---------------------------------------------------------------------------

/**
 * The complete set of shapes that the decoder can emit.
 *
 * Primitive JS types (boolean, number, string, null) represent scalar ScVal
 * variants that map cleanly: bool → boolean, void → null, i32/u32 → number,
 * symbol/string → string.
 *
 * Structured variants (error, unsupported, cycle, map entries, nested vecs)
 * use tagged object shapes with a unique discriminant property.
 */
// export type NormalizedValue =
//   | boolean
//   | number
//   | string
//   | null
//   | CycleMarker
//   | TruncatedMarker
//   | NormalizedError
//   | UnsupportedFallback
//   | Array<NormalizedValue>
//   | { [key: string]: NormalizedValue }
// Normalized representations for decoder outputs

export type PrimitiveKind =
  | 'bool'
  | 'u32'
  | 'i32'
  | 'string'
  | 'symbol'
  | 'void'

export interface NormalizedPrimitive {
  kind: 'primitive'
  primitive: PrimitiveKind
  value: boolean | number | string | null
}

export interface NormalizedVec {
  kind: 'vec'
  items: Array<NormalizedValue>
}

export interface NormalizedMap {
  kind: 'map'
  entries: Array<NormalizedMapEntry>
}

export type NormalizedAddressType =
  | 'account'
  | 'contract'
  | 'muxedAccount'
  | 'claimableBalance'
  | 'liquidityPool'
  | 'unknown'

export interface NormalizedAddress {
  kind: 'address'
  addressType: NormalizedAddressType
  value: string
}

export interface NormalizedTruncated {
  kind: 'truncated'
  depth?: number
}

export interface NormalizedUnsupported {
  kind: 'unsupported'
  variant: string
  rawData: unknown
}

export type NormalizedValue =
  | NormalizedPrimitive
  | NormalizedVec
  | NormalizedMap
  | NormalizedAddress
  | TruncatedMarker
  | NormalizedTruncated
  | NormalizedError
  | NormalizedUnsupported

// export { NormalizedMapEntry }
