import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'

interface TreeRowProps {
  row: FlatTreeRow
  isExpanded: boolean
  isSelected: boolean
  rowHeight: number
  onToggleExpand?: (rowId: string) => void
  onActivate?: (row: FlatTreeRow) => void
}

function formatPreview(row: FlatTreeRow): string {
  switch (row.node.kind) {
    case 'primitive':
      return String(row.node.value)
    case 'address':
      return row.node.value
    case 'error':
      return `${row.node.errorType}:${row.node.code}`
    case 'map':
      return `${row.node.entries.length} entries`
    case 'vec':
      return `${row.node.items.length} items`
    case 'unsupported':
      return row.node.variant
    case 'truncated':
      return `depth=${row.node.depth}`
    case 'cycle':
      return `depth=${row.node.depth}`
    default:
      return ''
  }
}

function typeBadge(row: FlatTreeRow): string {
  if (row.node.kind === 'primitive') {
    return row.node.scType
  }

  if (row.node.kind === 'address') {
    return `address:${row.node.addressType}`
  }

  return row.kind
}

export function TreeRow({
  row,
  isExpanded,
  isSelected,
  rowHeight,
  onToggleExpand,
  onActivate,
}: TreeRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="tree-row"
      onClick={() => onActivate?.(row)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate?.(row)
        }
      }}
      className={`w-full flex items-center gap-2 px-3 border-b border-white/5 text-left ${
        isSelected ? 'bg-primary/10' : 'hover:bg-white/5'
      }`}
      style={{ height: rowHeight }}
      aria-label={`Open ${row.label}`}
    >
      <div style={{ marginLeft: row.depth * 16 }} className="flex items-center gap-2 min-w-0">
        {row.hasChildren ? (
          <button
            type="button"
            className="text-xs text-text-muted hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand?.(row.id)
            }}
            aria-label={`Toggle ${row.label}`}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" aria-hidden="true" />
        )}

        <span className="font-mono text-xs text-white truncate">{row.label}</span>
        <span className="font-mono text-[10px] uppercase text-primary border border-primary/30 rounded px-1 py-0.5">
          {typeBadge(row)}
        </span>
        <span className="font-mono text-[11px] text-text-muted truncate">
          {formatPreview(row)}
        </span>
      </div>
    </div>
  )
}
