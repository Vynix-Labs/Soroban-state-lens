/**
 * Normalized node union types for Soroban State Lens
 *
 * This module defines the canonical output shapes produced by the decoder.
 * All normalized decoder outputs must be expressible as one of the variants
 * in the Node union. UI rendering, tree traversal, and diffing consume these types.
 *
 * Design principles:
 * - Every node carries stable `path` and `raw` metadata for traceability
 * - Primitives map cleanly to JSON equivalents
 * - Containers preserve structure for tree rendering
 * - Fallback nodes handle unsupported/truncated cases without data loss
 */

// ---------------------------------------------------------------------------
// Path
// ---------------------------------------------------------------------------

/**
 * Immutable path segment representing a single step in an ScVal tree.
 * Supports array indexing and map key values.
 */
export type PathSegment =
  | { type: 'index'; index: number }
  | { type: 'key'; key: Node }

export type Path = ReadonlyArray<PathSegment>

export const EMPTY_PATH: Path = Object.freeze([])

/**
 * Appends a segment to a path, returning a new frozen path.
 */
export function appendPath(base: Path, segment: PathSegment): Path {
  return Object.freeze([...base, segment])
}

// ---------------------------------------------------------------------------
// Raw ScVal
// ---------------------------------------------------------------------------

/**
 * Minimal representation of an ScVal suitable for raw metadata.
 * Matches the structure produced by stellar-sdk XDR parsing.
 */
export interface RawScVal {
  switch: string
  value?: unknown
}

// ---------------------------------------------------------------------------
// Primitive nodes
// ---------------------------------------------------------------------------

export type PrimitiveKind =
  | 'bool'
  | 'u32'
  | 'i32'
  | 'u64'
  | 'i64'
  | 'u128'
  | 'i128'
  | 'u256'
  | 'i256'
  | 'string'
  | 'symbol'
  | 'void'

/**
 * A primitive scalar value with its ScVal variant name and raw value.
 */
export interface PrimitiveNode {
  kind: 'primitive'
  path: Path
  scType: PrimitiveKind
  value: boolean | number | string | null
  raw: RawScVal
}

// ---------------------------------------------------------------------------
// Container nodes
// ---------------------------------------------------------------------------

/**
 * A vector (ordered list) of child nodes.
 */
export interface VecNode {
  kind: 'vec'
  path: Path
  items: Array<Node>
  raw: RawScVal
}

/**
 * A single key/value pair inside a map, preserving the normalized key.
 */
export interface MapEntryNode {
  key: Node
  value: Node
}

/**
 * A map (ordered associative container) of entry pairs.
 */
export interface MapNode {
  kind: 'map'
  path: Path
  entries: Array<MapEntryNode>
  raw: RawScVal
}

// ---------------------------------------------------------------------------
// Special nodes
// ---------------------------------------------------------------------------

/**
 * A Soroban contract error value.
 */
export interface ErrorNode {
  kind: 'error'
  path: Path
  errorType: string
  code: number
  raw: RawScVal
}

/**
 * An address value (account, contract, muxed, etc.).
 */
export interface AddressNode {
  kind: 'address'
  path: Path
  addressType:
    | 'account'
    | 'contract'
    | 'muxedAccount'
    | 'claimableBalance'
    | 'liquidityPool'
    | 'unknown'
  value: string
  raw: RawScVal
}

/**
 * Marker for cyclic references detected during traversal.
 */
export interface CycleNode {
  kind: 'cycle'
  path: Path
  depth: number
}

/**
 * Marker for truncation due to max depth limits.
 */
export interface TruncatedNode {
  kind: 'truncated'
  path: Path
  depth: number
}

/**
 * Fallback for unsupported or unrecognized ScVal variants.
 */
export interface UnsupportedNode {
  kind: 'unsupported'
  path: Path
  variant: string
  raw: RawScVal
}

// ---------------------------------------------------------------------------
// Node union
// ---------------------------------------------------------------------------

/**
 * Complete union of all node shapes the decoder can emit.
 */
export type Node =
  | PrimitiveNode
  | VecNode
  | MapNode
  | ErrorNode
  | AddressNode
  | CycleNode
  | TruncatedNode
  | UnsupportedNode

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isPrimitive(node: Node): node is PrimitiveNode {
  return node.kind === 'primitive'
}

export function isVec(node: Node): node is VecNode {
  return node.kind === 'vec'
}

export function isMap(node: Node): node is MapNode {
  return node.kind === 'map'
}

export function isContainer(node: Node): node is VecNode | MapNode {
  return node.kind === 'vec' || node.kind === 'map'
}

export function isError(node: Node): node is ErrorNode {
  return node.kind === 'error'
}

export function isAddress(node: Node): node is AddressNode {
  return node.kind === 'address'
}

export function isCycle(node: Node): node is CycleNode {
  return node.kind === 'cycle'
}

export function isTruncated(node: Node): node is TruncatedNode {
  return node.kind === 'truncated'
}

export function isUnsupported(node: Node): node is UnsupportedNode {
  return node.kind === 'unsupported'
}

export function isMarker(node: Node): node is CycleNode | TruncatedNode {
  return node.kind === 'cycle' || node.kind === 'truncated'
}
