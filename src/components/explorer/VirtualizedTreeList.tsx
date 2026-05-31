import { useMemo, useState } from 'react'
import type { UIEvent } from 'react'
import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'

interface VirtualizedTreeListProps {
  rows: Array<FlatTreeRow>
  height?: number
  rowHeight?: number
  overscan?: number
  onToggleExpand?: (rowId: string) => void
  expandedNodeIds?: ReadonlySet<string> | ReadonlyArray<string>
}

export function VirtualizedTreeList({
  rows,
  height = 420,
  rowHeight = 40,
  overscan = 4,
  onToggleExpand,
  expandedNodeIds = [],
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
              className="flex items-center gap-2 px-3 border-b border-white/5"
            >
              <div style={{ marginLeft: row.depth * 16 }} className="flex items-center gap-2">
                {row.hasChildren ? (
                  <button
                    type="button"
                    className="text-xs text-text-muted hover:text-white"
                    onClick={() => onToggleExpand?.(row.id)}
                    aria-label={`Toggle ${row.label}`}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                ) : (
                  <span className="w-4" />
                )}
                <span className="font-mono text-xs text-white">{row.label}</span>
                <span className="font-mono text-[10px] uppercase text-text-muted">
                  {row.kind}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
