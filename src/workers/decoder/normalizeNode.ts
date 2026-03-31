import { EMPTY_PATH, appendPath } from '../../types/node'
import { VisitedTracker, createVisitedTracker } from './guards'

import type {
  AddressNode,
  CycleNode,
  ErrorNode,
  MapNode,
  Node,
  Path,
  PathSegment,
  PrimitiveNode,
  RawScVal,
  TruncatedNode,
  UnsupportedNode,
  VecNode,
} from '../../types/node'

export { EMPTY_PATH, appendPath }
export type { Node, Path, PathSegment, RawScVal }

// Re-export guards for external use
export { VisitedTracker, createVisitedTracker }

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
 * Options for normalizeNode recursion limits.
 */
export interface NormalizeOptions {
  /** When set, nodes at this depth or deeper are replaced with a truncated marker. */
  maxDepth?: number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toRaw(scVal: ScVal | null | undefined): RawScVal {
  if (!scVal) {
    return { switch: '' }
  }
  return {
    switch: scVal.switch,
    value: scVal.value,
  }
}

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

function parts128ToString(value: unknown, signed: boolean): string | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null
  }

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

  const uLo = lo < 0n ? lo + (1n << 64n) : lo

  if (signed) {
    const combined = hi * (1n << 64n) + uLo
    const min = -(1n << 127n)
    const max = (1n << 127n) - 1n
    if (combined < min || combined > max) {
      return null
    }
    return combined.toString()
  } else {
    const uHi = hi < 0n ? hi + (1n << 64n) : hi
    const combined = uHi * (1n << 64n) + uLo
    const max = (1n << 128n) - 1n
    if (combined < 0n || combined > max) {
      return null
    }
    return combined.toString()
  }
}

function createCycleNode(path: Path, depth: number): CycleNode {
  return { kind: 'cycle', path, depth }
}

function createTruncatedNode(path: Path, depth: number): TruncatedNode {
  return { kind: 'truncated', path, depth }
}

function createUnsupportedNode(
  path: Path,
  variant: string,
  scVal: ScVal | null | undefined,
): UnsupportedNode {
  return {
    kind: 'unsupported',
    path,
    variant,
    raw: toRaw(scVal),
  }
}

// ---------------------------------------------------------------------------
// Main normalization function
// ---------------------------------------------------------------------------

/**
 * Normalizes an ScVal to a fully-typed Node with path and raw metadata.
 *
 * @param scVal - The ScVal to normalize
 * @param path - Current path in the tree (default: empty)
 * @param visited - Optional visited tracker for cycle detection
 * @param options - Optional limits (e.g. maxDepth)
 * @param depth - Internal recursion depth; do not pass from caller
 * @returns Normalized node with path and raw metadata
 */
export function normalizeNode(
  scVal: ScVal | null | undefined,
  path: Path = [],
  visited?: VisitedTracker,
  options?: NormalizeOptions,
  depth?: number,
): Node {
  const currentDepth = depth ?? 0

  if (options?.maxDepth !== undefined && currentDepth >= options.maxDepth) {
    return createTruncatedNode(path, currentDepth)
  }

  if (visited === undefined) {
    visited = createVisitedTracker()
  }

  if (scVal && typeof scVal === 'object') {
    if (visited.hasVisited(scVal)) {
      return createCycleNode(path, visited.getDepth())
    }
    visited.markVisited(scVal)
  }

  if (!scVal || typeof scVal.switch !== 'string') {
    return createUnsupportedNode(path, 'Invalid', scVal)
  }

  switch (scVal.switch) {
    case ScValType.SCV_BOOL: {
      return {
        kind: 'primitive',
        path,
        scType: 'bool',
        value: typeof scVal.value === 'boolean' ? scVal.value : false,
        raw: toRaw(scVal),
      } satisfies PrimitiveNode
    }

    case ScValType.SCV_VOID: {
      return {
        kind: 'primitive',
        path,
        scType: 'void',
        value: null,
        raw: toRaw(scVal),
      } satisfies PrimitiveNode
    }

    case ScValType.SCV_U32: {
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= 0 &&
        scVal.value <= 0xffffffff
      ) {
        return {
          kind: 'primitive',
          path,
          scType: 'u32',
          value: scVal.value,
          raw: toRaw(scVal),
        } satisfies PrimitiveNode
      }
      return createUnsupportedNode(path, ScValType.SCV_U32, scVal)
    }

    case ScValType.SCV_I32: {
      if (
        typeof scVal.value === 'number' &&
        Number.isInteger(scVal.value) &&
        scVal.value >= -0x80000000 &&
        scVal.value <= 0x7fffffff
      ) {
        return {
          kind: 'primitive',
          path,
          scType: 'i32',
          value: scVal.value,
          raw: toRaw(scVal),
        } satisfies PrimitiveNode
      }
      return createUnsupportedNode(path, ScValType.SCV_I32, scVal)
    }

    case ScValType.SCV_U64: {
      const str = bigIntLikeToString(scVal.value)
      if (str !== null) {
        const n = BigInt(str)
        if (n >= 0n && n <= 0xffffffffffffffffn) {
          return {
            kind: 'primitive',
            path,
            scType: 'u64',
            value: str,
            raw: toRaw(scVal),
          } satisfies PrimitiveNode
        }
      }
      return createUnsupportedNode(path, ScValType.SCV_U64, scVal)
    }

    case ScValType.SCV_I64: {
      const str = bigIntLikeToString(scVal.value)
      if (str !== null) {
        const n = BigInt(str)
        if (n >= -0x8000000000000000n && n <= 0x7fffffffffffffffn) {
          return {
            kind: 'primitive',
            path,
            scType: 'i64',
            value: str,
            raw: toRaw(scVal),
          } satisfies PrimitiveNode
        }
      }
      return createUnsupportedNode(path, ScValType.SCV_I64, scVal)
    }

    case ScValType.SCV_U128: {
      const str = parts128ToString(scVal.value, false)
      if (str !== null) {
        return {
          kind: 'primitive',
          path,
          scType: 'u128',
          value: str,
          raw: toRaw(scVal),
        } satisfies PrimitiveNode
      }
      return createUnsupportedNode(path, ScValType.SCV_U128, scVal)
    }

    case ScValType.SCV_I128: {
      const str = parts128ToString(scVal.value, true)
      if (str !== null) {
        return {
          kind: 'primitive',
          path,
          scType: 'i128',
          value: str,
          raw: toRaw(scVal),
        } satisfies PrimitiveNode
      }
      return createUnsupportedNode(path, ScValType.SCV_I128, scVal)
    }

    case ScValType.SCV_U256: {
      return createUnsupportedNode(path, ScValType.SCV_U256, scVal)
    }

    case ScValType.SCV_I256: {
      return createUnsupportedNode(path, ScValType.SCV_I256, scVal)
    }

    case ScValType.SCV_STRING: {
      return {
        kind: 'primitive',
        path,
        scType: 'string',
        value: typeof scVal.value === 'string' ? scVal.value : '',
        raw: toRaw(scVal),
      } satisfies PrimitiveNode
    }

    case ScValType.SCV_SYMBOL: {
      return {
        kind: 'primitive',
        path,
        scType: 'symbol',
        value: typeof scVal.value === 'string' ? scVal.value : '',
        raw: toRaw(scVal),
      } satisfies PrimitiveNode
    }

    case ScValType.SCV_ERROR: {
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
          kind: 'error',
          path,
          errorType: String(err.type),
          code: Number(err.code),
          raw: toRaw(scVal),
        } satisfies ErrorNode
      }
      return {
        kind: 'error',
        path,
        errorType: 'unknown',
        code: 0,
        raw: toRaw(scVal),
      } satisfies ErrorNode
    }

    case ScValType.SCV_VEC: {
      // Early return for null/undefined values - optimization for empty vectors
      if (scVal.value == null) {
        return {
          kind: 'vec',
          path,
          items: [],
          raw: toRaw(scVal),
        } satisfies VecNode
      }

      if (!Array.isArray(scVal.value)) {
        return {
          kind: 'vec',
          path,
          items: [],
          raw: toRaw(scVal),
        } satisfies VecNode
      }

      // Pre-allocate array with known size for better performance
      const items: Array<Node> = new Array(scVal.value.length)

      // Use for loop with better error handling for large arrays
      for (let i = 0; i < scVal.value.length; i++) {
        try {
          const childPath = appendPath(path, { type: 'index', index: i })
          items[i] = normalizeNode(
            scVal.value[i],
            childPath,
            visited,
            options,
            currentDepth + 1,
          )
        } catch (error) {
          // Handle individual item errors gracefully
          items[i] = createUnsupportedNode(
            appendPath(path, { type: 'index', index: i }),
            'VectorItemError',
            scVal.value[i],
          )
        }
      }

      return {
        kind: 'vec',
        path,
        items,
        raw: toRaw(scVal),
      } satisfies VecNode
    }

    case ScValType.SCV_MAP: {
      const entries: Array<{ key: Node; value: Node }> = []
      if (Array.isArray(scVal.value)) {
        for (const entry of scVal.value) {
          const keyNode = normalizeNode(
            entry.key,
            path,
            visited,
            options,
            currentDepth + 1,
          )
          const keyPath = appendPath(path, { type: 'key', key: keyNode })
          const valueNode = normalizeNode(
            entry.val,
            keyPath,
            visited,
            options,
            currentDepth + 1,
          )
          entries.push({ key: keyNode, value: valueNode })
        }
      }
      return {
        kind: 'map',
        path,
        entries,
        raw: toRaw(scVal),
      } satisfies MapNode
    }

    case ScValType.SCV_ADDRESS: {
      try {
        const address = scVal.value as { toString: () => string }
        const value = address.toString()
        let addressType: AddressNode['addressType'] = 'unknown'

        if (typeof value === 'string' && value.length > 0) {
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
          }
        }

        return {
          kind: 'address',
          path,
          addressType,
          value,
          raw: toRaw(scVal),
        } satisfies AddressNode
      } catch {
        return {
          kind: 'address',
          path,
          addressType: 'unknown',
          value: '',
          raw: toRaw(scVal),
        } satisfies AddressNode
      }
    }

    default:
      return createUnsupportedNode(path, scVal.switch, scVal)
  }
}
