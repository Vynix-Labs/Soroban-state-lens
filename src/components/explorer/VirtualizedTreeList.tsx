import { useMemo, useState } from 'react'
import { TreeRow } from './TreeRow'
import type { UIEvent } from 'react'
import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'

interface VirtualizedTreeListProps {
  rows: Array<FlatTreeRow>
  height?: number
  rowHeight?: number
  overscan?: number
  onToggleExpand?: (rowId: string) => void
  expandedNodeIds?: ReadonlySet<string> | ReadonlyArray<string>
  selectedRowId?: string | null
  onActivateRow?: (row: FlatTreeRow) => void
}

export function VirtualizedTreeList({
  rows,
  height = 420,
  rowHeight = 40,
  overscan = 4,
  onToggleExpand,
  expandedNodeIds = [],
  selectedRowId,
  onActivateRow,
}: VirtualizedTreeListProps) {
  const [scrollTop, setScrollTop] = useState(0)

  const expandedIds = useMemo(
    () =>
      expandedNodeIds instanceof Set
        ? expandedNodeIds
        : new Set(expandedNodeIds),
    [expandedNodeIds],
  )

  const totalHeight = rows.length * rowHeight
  const viewportCount = Math.max(1, Math.ceil(height / rowHeight))
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(rows.length, startIndex + viewportCount + overscan * 2)
  const visibleRows = rows.slice(startIndex, endIndex)

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }

  return (
    <div
      className="overflow-auto rounded border border-border-dark bg-surface-dark/30"
      style={{ height }}
      onScroll={handleScroll}
      data-testid="virtualized-tree-list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleRows.map((row, index) => {
          const rowIndex = startIndex + index
          const top = rowIndex * rowHeight
          const isExpanded = expandedIds.has(row.id)

          return (
            <div
              key={row.id}
              data-testid="virtualized-tree-row"
              style={{
                position: 'absolute',
                top,
                height: rowHeight,
                left: 0,
                right: 0,
              }}
              className="left-0 right-0"
            >
              <TreeRow
                row={row}
                rowHeight={rowHeight}
                isExpanded={isExpanded}
                isSelected={selectedRowId === row.id}
                onToggleExpand={onToggleExpand}
                onActivate={onActivateRow}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
