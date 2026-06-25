import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TreeRow } from '../../components/explorer/TreeRow'
import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'
import type { Node } from '../../types/node'

const primitiveNode: Node = {
  kind: 'primitive',
  path: [],
  scType: 'string',
  value: 'hello',
  raw: { switch: 'ScvString' },
}

function makeRow(partial: Partial<FlatTreeRow> = {}): FlatTreeRow {
  return {
    id: 'row-1',
    parentId: null,
    depth: 2,
    keyPath: 'row-1',
    label: 'entry[0].value',
    kind: 'primitive',
    hasChildren: false,
    childCount: 0,
    node: primitiveNode,
    ...partial,
  }
}

describe('TreeRow', () => {
  it('renders indentation spacer for leaf nodes', () => {
    render(
      <TreeRow
        row={makeRow()}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.queryByRole('button', { name: /toggle/i })).toBeNull()
    expect(screen.getByText('hello')).toBeTruthy()
    expect(screen.getByText('string')).toBeTruthy()
  })

  it('renders expander only for parent rows', () => {
    const row = makeRow({
      hasChildren: true,
      kind: 'vec',
      node: { kind: 'vec', path: [], items: [], raw: { switch: 'ScvVec' } },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Toggle entry[0].value' })).toBeTruthy()
    expect(screen.getByText('vec')).toBeTruthy()
    expect(screen.getByText('0 items')).toBeTruthy()
  })

  it('calls activate handler on row click', () => {
    const onActivate = vi.fn()
    const row = makeRow()

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
        onActivate={onActivate}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open entry[0].value' }))
    expect(onActivate).toHaveBeenCalledWith(row)
  })
})
