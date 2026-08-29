import { describe, expect, it } from 'vitest'
import {
  collectExpandableNodeIds,
  flattenTree,
} from '../../lib/tree/flattenTree'
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

function symbol(value: string): Node {
  return {
    kind: 'primitive',
    path: [],
    scType: 'symbol',
    value,
    raw: { switch: 'ScvSymbol' },
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

  it('includes short symbol previews in map key labels only', () => {
    const symbolMap: Node = {
      kind: 'map',
      path: [],
      raw: { switch: 'ScvMap' },
      entries: [
        { key: symbol('admin'), value: primitive('first') },
        { key: symbol('treasury'), value: primitive('second') },
      ],
    }

    const rows = flattenTree(
      [{ id: 'root', label: 'root', node: symbolMap }],
      ['root'],
    )

    expect(rows.map((row) => row.label)).toEqual([
      'root',
      'entry[0].key (admin)',
      'entry[0].value',
      'entry[1].key (treasury)',
      'entry[1].value',
    ])
  })

  it('falls back for unreadable keys and bounds long previews', () => {
    const previewMap: Node = {
      kind: 'map',
      path: [],
      raw: { switch: 'ScvMap' },
      entries: [
        {
          key: { kind: 'truncated', path: [], depth: 1 },
          value: primitive('first'),
        },
        {
          key: symbol('a-very-long-symbol-key-that-must-be-shortened'),
          value: primitive('second'),
        },
      ],
    }

    const rows = flattenTree(
      [{ id: 'root', label: 'root', node: previewMap }],
      ['root'],
    )

    expect(rows[1]?.label).toBe('entry[0].key')
    expect(rows[3]?.label).toBe('entry[1].key (a-very-long-symbol-key-…)')
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

describe('collectExpandableNodeIds', () => {
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

  it('returns the root and nested container ids regardless of expansion', () => {
    const ids = collectExpandableNodeIds([
      { id: 'root', label: 'root', node: tree },
    ])
    expect(ids).toEqual(['root', 'root.entry-0-value'])
  })

  it('returns an empty array for primitive roots', () => {
    const ids = collectExpandableNodeIds([
      { id: 'root', label: 'root', node: primitive('leaf') },
    ])
    expect(ids).toEqual([])
  })

  it('returns an empty array when there are no roots', () => {
    expect(collectExpandableNodeIds([])).toEqual([])
  })
})
