import { describe, expect, it } from 'vitest'
import {
  EMPTY_PATH,
  ScValType,
  appendPath,
  normalizeNode,
} from '../../workers/decoder/normalizeNode'
import type { ScVal } from '../../workers/decoder/normalizeNode'
import type {
  CycleNode,
  ErrorNode,
  MapNode,
  PrimitiveNode,
  TruncatedNode,
  UnsupportedNode,
  VecNode,
} from '../../types/node'

function makeScVal(switchType: ScValType, value?: unknown): ScVal {
  return { switch: switchType, value }
}

describe('normalizeNode – Path and Raw Metadata', () => {
  it('root node has empty path', () => {
    const result = normalizeNode(makeScVal(ScValType.SCV_BOOL, true))
    expect(result.path).toEqual(EMPTY_PATH)
  })

  it('root node has raw metadata', () => {
    const scVal = makeScVal(ScValType.SCV_STRING, 'hello')
    const result = normalizeNode(scVal) as PrimitiveNode
    expect(result.raw).toEqual({ switch: ScValType.SCV_STRING, value: 'hello' })
  })

  it('vec items have indexed paths', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_U32, 1),
      makeScVal(ScValType.SCV_U32, 2),
      makeScVal(ScValType.SCV_U32, 3),
    ])
    const result = normalizeNode(scVal) as VecNode

    expect(result.items[0].path).toEqual([{ type: 'index', index: 0 }])
    expect(result.items[1].path).toEqual([{ type: 'index', index: 1 }])
    expect(result.items[2].path).toEqual([{ type: 'index', index: 2 }])
  })

  it('nested vec items have correct deep paths', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_VEC, [makeScVal(ScValType.SCV_U32, 42)]),
    ])
    const result = normalizeNode(scVal) as VecNode
    const inner = result.items[0] as VecNode

    expect(inner.items[0].path).toEqual([
      { type: 'index', index: 0 },
      { type: 'index', index: 0 },
    ])
  })

  it('map entries have key-indexed paths', () => {
    const scVal = makeScVal(ScValType.SCV_MAP, [
      {
        key: makeScVal(ScValType.SCV_SYMBOL, 'name'),
        val: makeScVal(ScValType.SCV_STRING, 'Alice'),
      },
    ])
    const result = normalizeNode(scVal) as MapNode

    expect(result.entries[0].key.kind).toBe('primitive')
    expect(result.entries[0].key.path).toEqual(EMPTY_PATH)
    expect(result.entries[0].value.path).toEqual([
      { type: 'key', key: result.entries[0].key },
    ])
  })
})

describe('normalizeNode – Primitive Nodes', () => {
  it('bool node has correct shape', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_BOOL, true),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('bool')
    expect(result.value).toBe(true)
    expect(result.path).toEqual(EMPTY_PATH)
    expect(result.raw.switch).toBe(ScValType.SCV_BOOL)
  })

  it('void node has null value', () => {
    const result = normalizeNode(makeScVal(ScValType.SCV_VOID)) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('void')
    expect(result.value).toBeNull()
  })

  it('u32 node preserves numeric value', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_U32, 42),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('u32')
    expect(result.value).toBe(42)
  })

  it('i32 node preserves negative values', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_I32, -100),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('i32')
    expect(result.value).toBe(-100)
  })

  it('u64 node returns decimal string', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_U64, '18446744073709551615'),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('u64')
    expect(result.value).toBe('18446744073709551615')
    expect(typeof result.value).toBe('string')
  })

  it('i64 node handles negative values as string', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_I64, '-9223372036854775808'),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('i64')
    expect(result.value).toBe('-9223372036854775808')
  })

  it('string node preserves content', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_STRING, 'hello world'),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('string')
    expect(result.value).toBe('hello world')
  })

  it('symbol node preserves content', () => {
    const result = normalizeNode(
      makeScVal(ScValType.SCV_SYMBOL, 'TRANSFER'),
    ) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('symbol')
    expect(result.value).toBe('TRANSFER')
  })

  it('u128 node from hi/lo parts', () => {
    const scVal = makeScVal(ScValType.SCV_U128, { hi: 0n, lo: 42n })
    const result = normalizeNode(scVal) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('u128')
    expect(result.value).toBe('42')
  })

  it('i128 node from hi/lo parts', () => {
    const scVal = makeScVal(ScValType.SCV_I128, {
      hi: -1n,
      lo: BigInt('18446744073709551615'),
    })
    const result = normalizeNode(scVal) as PrimitiveNode

    expect(result.kind).toBe('primitive')
    expect(result.scType).toBe('i128')
    expect(result.value).toBe('-1')
  })
})

describe('normalizeNode – Container Nodes', () => {
  it('vec node has correct shape', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_U32, 1),
    ])
    const result = normalizeNode(scVal) as VecNode

    expect(result.kind).toBe('vec')
    expect(result.items).toHaveLength(1)
    expect(result.raw.switch).toBe(ScValType.SCV_VEC)
  })

  it('empty vec has empty items', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [])
    const result = normalizeNode(scVal) as VecNode

    expect(result.kind).toBe('vec')
    expect(result.items).toHaveLength(0)
  })

  it('map node has correct shape', () => {
    const scVal = makeScVal(ScValType.SCV_MAP, [
      {
        key: makeScVal(ScValType.SCV_SYMBOL, 'key'),
        val: makeScVal(ScValType.SCV_STRING, 'value'),
      },
    ])
    const result = normalizeNode(scVal) as MapNode

    expect(result.kind).toBe('map')
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].key.kind).toBe('primitive')
    expect(result.entries[0].value.kind).toBe('primitive')
    expect(result.raw.switch).toBe(ScValType.SCV_MAP)
  })

  it('empty map has empty entries', () => {
    const scVal = makeScVal(ScValType.SCV_MAP, [])
    const result = normalizeNode(scVal) as MapNode

    expect(result.kind).toBe('map')
    expect(result.entries).toHaveLength(0)
  })
})

describe('normalizeNode – Error Node', () => {
  it('error node has correct shape', () => {
    const scVal = makeScVal(ScValType.SCV_ERROR, { type: 'contract', code: 1 })
    const result = normalizeNode(scVal) as ErrorNode

    expect(result.kind).toBe('error')
    expect(result.errorType).toBe('contract')
    expect(result.code).toBe(1)
    expect(result.raw.switch).toBe(ScValType.SCV_ERROR)
  })

  it('malformed error returns unknown type with code 0', () => {
    const scVal = makeScVal(ScValType.SCV_ERROR, null)
    const result = normalizeNode(scVal) as ErrorNode

    expect(result.kind).toBe('error')
    expect(result.errorType).toBe('unknown')
    expect(result.code).toBe(0)
  })
})

describe('normalizeNode – Truncation', () => {
  it('returns truncated node when maxDepth exceeded', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_VEC, [makeScVal(ScValType.SCV_U32, 1)]),
    ])

    const result = normalizeNode(scVal, EMPTY_PATH, undefined, { maxDepth: 0 })

    expect(result.kind).toBe('truncated')
    expect((result as TruncatedNode).depth).toBe(0)
    expect(result.path).toEqual(EMPTY_PATH)
  })

  it('items at depth boundary are truncated', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_U32, 1),
      makeScVal(ScValType.SCV_VEC, [makeScVal(ScValType.SCV_U32, 2)]),
    ])

    const result = normalizeNode(scVal, EMPTY_PATH, undefined, {
      maxDepth: 1,
    }) as VecNode

    expect(result.kind).toBe('vec')
    expect(result.items[0].kind).toBe('truncated')
    expect(result.items[1].kind).toBe('truncated')
    expect(result.items[0].path).toEqual([{ type: 'index', index: 0 }])
    expect(result.items[1].path).toEqual([{ type: 'index', index: 1 }])
  })

  it('children at depth 2 allowed when maxDepth is 3', () => {
    const scVal = makeScVal(ScValType.SCV_VEC, [
      makeScVal(ScValType.SCV_VEC, [makeScVal(ScValType.SCV_U32, 42)]),
    ])

    const result = normalizeNode(scVal, EMPTY_PATH, undefined, {
      maxDepth: 3,
    }) as VecNode
    const inner = result.items[0] as VecNode

    expect(result.kind).toBe('vec')
    expect(inner.kind).toBe('vec')
    expect(inner.items[0].kind).toBe('primitive')
  })
})

describe('normalizeNode – Cycle Detection', () => {
  it('returns cycle marker for visited objects', () => {
    const cycleTarget = makeScVal(ScValType.SCV_VEC, [])
    const scVal = makeScVal(ScValType.SCV_VEC, [cycleTarget as any])
    ;(scVal.value as Array<any>)[0] = scVal

    const result = normalizeNode(scVal) as VecNode

    expect(result.kind).toBe('vec')
    expect(result.items[0].kind).toBe('cycle')
    expect((result.items[0] as CycleNode).depth).toBeGreaterThan(0)
  })
})

describe('normalizeNode – Unsupported Node', () => {
  it('returns unsupported for invalid ScVal', () => {
    const result = normalizeNode(null)

    expect(result.kind).toBe('unsupported')
    expect((result as UnsupportedNode).variant).toBe('Invalid')
  })

  it('returns unsupported for unrecognized switch', () => {
    const scVal = { switch: 'UnknownType', value: 'data' } as unknown as ScVal
    const result = normalizeNode(scVal) as UnsupportedNode

    expect(result.kind).toBe('unsupported')
    expect(result.variant).toBe('UnknownType')
    expect(result.raw.switch).toBe('UnknownType')
  })

  it('returns unsupported for malformed u64', () => {
    const scVal = makeScVal(ScValType.SCV_U64, 'not-a-number')
    const result = normalizeNode(scVal) as UnsupportedNode

    expect(result.kind).toBe('unsupported')
    expect(result.variant).toBe(ScValType.SCV_U64)
  })

  it('returns unsupported for u256 (out of scope)', () => {
    const scVal = makeScVal(ScValType.SCV_U256, { hi: 0n, lo: 0n })
    const result = normalizeNode(scVal) as UnsupportedNode

    expect(result.kind).toBe('unsupported')
    expect(result.variant).toBe(ScValType.SCV_U256)
  })

  it('returns unsupported for i256 (out of scope)', () => {
    const scVal = makeScVal(ScValType.SCV_I256, { hi: 0n, lo: 0n })
    const result = normalizeNode(scVal) as UnsupportedNode

    expect(result.kind).toBe('unsupported')
    expect(result.variant).toBe(ScValType.SCV_I256)
  })
})

describe('normalizeNode – Path Utility Functions', () => {
  it('appendPath creates new path with index segment', () => {
    const path = appendPath(EMPTY_PATH, { type: 'index', index: 5 })

    expect(path).toHaveLength(1)
    expect(path[0]).toEqual({ type: 'index', index: 5 })
  })

  it('appendPath preserves original path', () => {
    const original = appendPath(EMPTY_PATH, { type: 'index', index: 0 })
    const extended = appendPath(original, { type: 'index', index: 1 })

    expect(original).toHaveLength(1)
    expect(extended).toHaveLength(2)
  })

  it('path is immutable (Object.freeze)', () => {
    const path = appendPath(EMPTY_PATH, { type: 'index', index: 0 })

    expect(() => {
      ;(path as any).push({ type: 'index', index: 1 })
    }).toThrow()
  })
})
