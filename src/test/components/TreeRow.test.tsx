import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TreeRow } from '../../components/explorer/TreeRow'
import { useLensStore } from '../../store/lensStore'
import { BigIntDisplayMode, ByteDisplayMode } from '../../store/types'
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
  afterEach(() => {
    useLensStore.getState().resetPreferences()
  })

  it('shows a root ledger class and durability while retaining the raw key', () => {
    const row = makeRow({
      depth: 0,
      label: 'counter',
      ledgerType: 'ContractData',
      durability: 'Persistent',
      canonicalKey: 'raw-ledger-key',
    })
    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )
    expect(screen.getByText('counter')).toBeTruthy()
    expect(screen.getByText('ContractData')).toBeTruthy()
    expect(screen.getByText('Persistent')).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: 'Copy canonical ledger key raw-ledger-key',
      }),
    ).toBeTruthy()
  })

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
    expect(
      screen
        .getByRole('treeitem', { name: 'Open entry[0].value' })
        .getAttribute('aria-level'),
    ).toBe('3')
    expect(screen.getByText('hello')).toBeTruthy()
    expect(screen.getByText('string')).toBeTruthy()
  })

  it('marks expired rows while preserving the value preview', () => {
    render(
      <TreeRow
        row={makeRow({ expired: true })}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('Expired')).toBeTruthy()
    expect(screen.getByText('hello')).toBeTruthy()
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

    expect(
      screen.getByRole('button', { name: 'Toggle entry[0].value' }),
    ).toBeTruthy()
    expect(screen.getByText('vec')).toBeTruthy()
    expect(screen.getByText('0 items')).toBeTruthy()
  })

  it('reports expansion state only for expandable rows', () => {
    const row = makeRow({
      hasChildren: true,
      kind: 'vec',
      node: { kind: 'vec', path: [], items: [], raw: { switch: 'ScvVec' } },
    })

    const { rerender } = render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    const expandableRow = screen.getByRole('treeitem', {
      name: 'Open entry[0].value',
    })
    expect(expandableRow.getAttribute('aria-expanded')).toBe('false')

    rerender(
      <TreeRow row={row} rowHeight={40} isExpanded={true} isSelected={false} />,
    )
    expect(expandableRow.getAttribute('aria-expanded')).toBe('true')

    rerender(
      <TreeRow
        row={makeRow()}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )
    expect(
      screen
        .getByRole('treeitem', { name: 'Open entry[0].value' })
        .getAttribute('aria-expanded'),
    ).toBeNull()
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

    fireEvent.click(
      screen.getByRole('treeitem', { name: 'Open entry[0].value' }),
    )
    expect(onActivate).toHaveBeenCalledWith(row)
  })

  it('calls activate handler on Enter and Space', () => {
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

    const treeitem = screen.getByRole('treeitem', {
      name: 'Open entry[0].value',
    })
    fireEvent.keyDown(treeitem, { key: 'Enter' })
    fireEvent.keyDown(treeitem, { key: ' ' })

    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(onActivate).toHaveBeenCalledWith(row)
  })

  it('notifies parent on ArrowUp and ArrowDown', () => {
    const onKeyNavigate = vi.fn()
    const row = makeRow()

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
        onKeyNavigate={onKeyNavigate}
      />,
    )

    const treeitem = screen.getByRole('treeitem', {
      name: 'Open entry[0].value',
    })
    fireEvent.keyDown(treeitem, { key: 'ArrowDown' })
    fireEvent.keyDown(treeitem, { key: 'ArrowUp' })

    expect(onKeyNavigate).toHaveBeenNthCalledWith(1, 'down')
    expect(onKeyNavigate).toHaveBeenNthCalledWith(2, 'up')
  })

  it('shows a distinct truncation preview for truncated marker rows', () => {
    const row = makeRow({
      kind: 'truncated',
      label: 'truncated-marker',
      node: { kind: 'truncated', path: [], depth: 3 },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('truncated')).toBeTruthy()
    expect(screen.getByText('truncated at depth=3')).toBeTruthy()
  })

  it('shows a distinct cycle preview for cycle marker rows', () => {
    const row = makeRow({
      kind: 'cycle',
      label: 'cycle-marker',
      node: { kind: 'cycle', path: [], depth: 3 },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('cycle')).toBeTruthy()
    expect(screen.getByText('cycle detected at depth=3')).toBeTruthy()
  })

  it('formats byte previews using the saved preference', () => {
    act(() => {
      useLensStore.getState().setByteDisplayMode(ByteDisplayMode.UTF8)
    })
    const row = makeRow({
      node: {
        kind: 'primitive',
        path: [],
        scType: 'bytes',
        value: [65, 66],
        raw: { switch: 'ScvBytes' },
      },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('AB')).toBeTruthy()
  })

  it('formats large integer previews using the saved preference', () => {
    act(() => {
      useLensStore.getState().setBigIntDisplayMode(BigIntDisplayMode.HEX)
    })
    const row = makeRow({
      node: {
        kind: 'primitive',
        path: [],
        scType: 'u64',
        value: '255',
        raw: { switch: 'ScvU64' },
      },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('0xff')).toBeTruthy()
  })

  it('reports collection limits without counting the truncation marker', () => {
    const row = makeRow({
      kind: 'vec',
      node: {
        kind: 'vec',
        path: [],
        items: [
          primitiveNode,
          primitiveNode,
          primitiveNode,
          { kind: 'truncated', path: [], depth: 1 },
        ],
        childLimit: 3,
        omittedChildren: 2,
        raw: { switch: 'ScvVec' },
      },
    })

    render(
      <TreeRow
        row={row}
        rowHeight={40}
        isExpanded={false}
        isSelected={false}
      />,
    )

    expect(screen.getByText('3 items (limit 3, 2 omitted)')).toBeTruthy()
  })
})
