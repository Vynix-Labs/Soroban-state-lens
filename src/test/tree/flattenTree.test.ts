import { describe, expect, it } from 'vitest'
import { flattenTree } from '../../lib/tree/flattenTree'
import type { Node } from '../../types/node'

function primitive(value: string): Node {
  return {
    kind: 'primitive',
    path: [],
    scType: 'string',
    value,
    raw: { switch: 'ScvString' },
  }
}

describe('flattenTree', () => {
  const tree: Node = {
    kind: 'map',
    path: [],
    raw: { switch: 'ScvMap' },
    entries: [
      {
        key: primitive('k0'),
        value: {
          kind: 'vec',
          path: [],
          raw: { switch: 'ScvVec' },
          items: [primitive('v0'), primitive('v1')],
        },
      },
      {
        key: primitive('k1'),
        value: primitive('leaf'),
      },
    ],
  }

  it('shows only root when collapsed', () => {
    const rows = flattenTree([{ id: 'root', label: 'root', node: tree }], [])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('root')
  })

  it('shows direct descendants when root expanded', () => {
    const rows = flattenTree([{ id: 'root', label: 'root', node: tree }], ['root'])
    expect(rows.map((row) => row.id)).toEqual([
      'root',
      'root.entry-0-key',
      'root.entry-0-value',
      'root.entry-1-key',
      'root.entry-1-value',
    ])
  })

  it('shows nested descendants deterministically', () => {
    const rows = flattenTree([{ id: 'root', label: 'root', node: tree }], [
      'root',
      'root.entry-0-value',
    ])

    expect(rows.map((row) => row.id)).toEqual([
      'root',
      'root.entry-0-key',
      'root.entry-0-value',
      'root.entry-0-value.item-0',
      'root.entry-0-value.item-1',
      'root.entry-1-key',
      'root.entry-1-value',
    ])
  })

  it('supports marker and unsupported node kinds', () => {
    const roots: Array<{ id: string; label: string; node: Node }> = [
      { id: 'unsupported', label: 'unsupported', node: { kind: 'unsupported', path: [], variant: 'X', raw: { switch: 'ScvX' } } },
      { id: 'truncated', label: 'truncated', node: { kind: 'truncated', path: [], depth: 7 } },
    ]

    const rows = flattenTree(roots, [])
    expect(rows.map((row) => row.kind)).toEqual(['unsupported', 'truncated'])
  })
})
