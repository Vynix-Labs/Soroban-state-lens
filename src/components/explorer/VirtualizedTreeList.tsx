import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [focusedRowIndex, setFocusedRowIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const focusedRowRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useRef(false)

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

  const scrollRowIntoView = (index: number) => {
    const container = containerRef.current
    if (!container || rows.length === 0) {
      return
    }

    const rowTop = index * rowHeight
    const rowBottom = rowTop + rowHeight
    const viewTop = container.scrollTop
    const viewBottom = viewTop + height

    if (rowTop < viewTop) {
      container.scrollTop = rowTop
      setScrollTop(rowTop)
    } else if (rowBottom > viewBottom) {
      const nextScrollTop = rowBottom - height
      container.scrollTop = nextScrollTop
      setScrollTop(nextScrollTop)
    }
  }

  const moveFocus = (direction: 'up' | 'down') => {
    if (rows.length === 0) {
      return
    }

    const delta = direction === 'down' ? 1 : -1
    const nextIndex = Math.min(
      rows.length - 1,
      Math.max(0, focusedRowIndex + delta),
    )

    if (nextIndex === focusedRowIndex) {
      return
    }

    pendingFocusRef.current = true
    setFocusedRowIndex(nextIndex)
    scrollRowIntoView(nextIndex)
  }

  useEffect(() => {
    if (rows.length === 0) {
      setFocusedRowIndex(0)
      return
    }

    if (focusedRowIndex > rows.length - 1) {
      setFocusedRowIndex(rows.length - 1)
    }
  }, [focusedRowIndex, rows.length])

  useEffect(() => {
    if (!pendingFocusRef.current) {
      return
    }

    pendingFocusRef.current = false
    focusedRowRef.current?.focus()
  }, [focusedRowIndex, startIndex, endIndex])

  return (
    <div
      ref={containerRef}
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
          const isFocused = rowIndex === focusedRowIndex

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
                tabIndex={isFocused ? 0 : -1}
                rowRef={isFocused ? focusedRowRef : undefined}
                onToggleExpand={onToggleExpand}
                onActivate={onActivateRow}
                onKeyNavigate={moveFocus}
                onFocus={() => setFocusedRowIndex(rowIndex)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
