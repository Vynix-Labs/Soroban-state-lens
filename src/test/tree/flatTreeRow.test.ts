import { describe, expect, it } from 'vitest'
import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'
import type { Node } from '../../types/node'

const baseNode: Node = {
  kind: 'primitive',
  path: [],
  scType: 'string',
  value: 'hello',
  raw: { switch: 'ScvString' },
}

describe('FlatTreeRow model', () => {
  it('represents primitive visible rows', () => {
    const row: FlatTreeRow = {
      id: 'root',
      parentId: null,
      depth: 0,
      keyPath: 'root',
      label: 'root',
      kind: 'primitive',
      hasChildren: false,
      childCount: 0,
      node: baseNode,
    }

    expect(row.kind).toBe('primitive')
    expect(row.childCount).toBe(0)
  })

  it('represents unsupported and truncated placeholders', () => {
    const unsupported: FlatTreeRow = {
      id: 'unsupported',
      parentId: null,
      depth: 0,
      keyPath: 'unsupported',
      label: 'unsupported',
      kind: 'unsupported',
      hasChildren: false,
      childCount: 0,
      node: { kind: 'unsupported', path: [], variant: 'ScvFoo', raw: { switch: 'ScvFoo' } },
    }

    const truncated: FlatTreeRow = {
      id: 'truncated',
      parentId: null,
      depth: 0,
      keyPath: 'truncated',
      label: 'truncated',
      kind: 'truncated',
      hasChildren: false,
      childCount: 0,
      node: { kind: 'truncated', path: [], depth: 3 },
    }

    expect(unsupported.kind).toBe('unsupported')
    expect(truncated.kind).toBe('truncated')
  })
})
