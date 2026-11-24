import { useState } from 'react'
import { formatScBytesByPreference } from '../../lib/format/formatScBytesByPreference'
import { formatScIntegerByPreference } from '../../lib/format/formatScIntegerByPreference'
import { useLensStore } from '../../store/lensStore'
import type { BigIntDisplayMode, ByteDisplayMode } from '../../store/types'
import type { KeyboardEvent, MouseEvent, Ref } from 'react'
import type { FlatTreeRow } from '../../lib/tree/flatTreeRow'

interface TreeRowProps {
  row: FlatTreeRow
  isExpanded: boolean
  isSelected: boolean
  rowHeight: number
  tabIndex?: number
  rowRef?: Ref<HTMLDivElement>
  onToggleExpand?: (rowId: string) => void
  onActivate?: (row: FlatTreeRow) => void
  onKeyNavigate?: (direction: 'up' | 'down') => void
  onFocus?: () => void
}

function formatPreview(
  row: FlatTreeRow,
  byteDisplayMode: ByteDisplayMode,
  bigIntDisplayMode: BigIntDisplayMode,
): string {
  switch (row.node.kind) {
    case 'primitive': {
      if (row.node.scType === 'bytes' && Array.isArray(row.node.value)) {
        return formatScBytesByPreference(row.node.value, byteDisplayMode)
      }

      if (
        row.node.scType === 'u64' ||
        row.node.scType === 'i64' ||
        row.node.scType === 'timepoint' ||
        row.node.scType === 'duration' ||
        row.node.scType === 'u128' ||
        row.node.scType === 'i128' ||
        row.node.scType === 'u256' ||
        row.node.scType === 'i256'
      ) {
        return formatScIntegerByPreference(
          row.node.value as string,
          bigIntDisplayMode,
        )
      }

      return String(row.node.value)
    }
    case 'address':
      return row.node.value
    case 'error':
      return `${row.node.errorType}:${row.node.code}`
    case 'map':
      return formatCollectionPreview(
        row.node.entries.length -
          (row.node.omittedChildren !== undefined &&
          row.node.entries.at(-1)?.key.kind === 'truncated'
            ? 1
            : 0),
        'entries',
        row.node.childLimit,
        row.node.omittedChildren,
      )
    case 'vec':
      return formatCollectionPreview(
        row.node.items.length -
          (row.node.omittedChildren !== undefined &&
          row.node.items.at(-1)?.kind === 'truncated'
            ? 1
            : 0),
        'items',
        row.node.childLimit,
        row.node.omittedChildren,
      )
    case 'unsupported':
      return row.node.variant
    case 'truncated':
      return `truncated at depth=${row.node.depth}`
    case 'cycle':
      return `cycle detected at depth=${row.node.depth}`
    default:
      return ''
  }
}

function formatCollectionPreview(
  count: number,
  label: string,
  childLimit?: number,
  omittedChildren?: number,
): string {
  if (childLimit === undefined || omittedChildren === undefined) {
    return `${count} ${label}`
  }

  return `${count} ${label} (limit ${childLimit}, ${omittedChildren} omitted)`
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
  tabIndex = 0,
  rowRef,
  onToggleExpand,
  onActivate,
  onKeyNavigate,
  onFocus,
}: TreeRowProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  const byteDisplayMode = useLensStore(
    (state) => state.preferences.byteDisplayMode,
  )
  const bigIntDisplayMode = useLensStore(
    (state) => state.preferences.bigIntDisplayMode,
  )

  const handleCopyCanonicalKey = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation()
    if (!row.canonicalKey) return

    try {
      await navigator.clipboard.writeText(row.canonicalKey)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onKeyNavigate?.('down')
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onKeyNavigate?.('up')
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.(row)
    }
  }

  return (
    <div
      ref={rowRef}
      role="treeitem"
      tabIndex={tabIndex}
      data-testid="tree-row"
      onClick={() => onActivate?.(row)}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      className={`w-full flex items-center gap-2 px-3 border-b border-white/5 text-left ${
        isSelected ? 'bg-primary/10' : 'hover:bg-white/5'
      }`}
      style={{ height: rowHeight }}
      aria-label={`Open ${row.label}`}
      aria-level={row.depth + 1}
      aria-selected={isSelected}
      aria-expanded={row.hasChildren ? isExpanded : undefined}
    >
      <div
        style={{ marginLeft: row.depth * 16 }}
        className="flex items-center gap-2 min-w-0"
      >
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

        <span className="font-mono text-xs text-white truncate">
          {row.label}
        </span>
        <span className="font-mono text-[10px] uppercase text-primary border border-primary/30 rounded px-1 py-0.5">
          {typeBadge(row)}
        </span>
        {row.ledgerType ? (
          <span className="font-mono text-[10px] text-text-muted border border-white/10 rounded px-1 py-0.5">
            {row.ledgerType}
          </span>
        ) : null}
        {row.durability ? (
          <span className="font-mono text-[10px] uppercase text-text-muted border border-white/10 rounded px-1 py-0.5">
            {row.durability}
          </span>
        ) : null}
        {row.expired ? (
          <span className="font-mono text-[10px] uppercase text-red-300 border border-red-400/40 rounded px-1 py-0.5">
            Expired
          </span>
        ) : null}
        <span className="font-mono text-[11px] text-text-muted truncate">
          {formatPreview(row, byteDisplayMode, bigIntDisplayMode)}
        </span>
      </div>
      {row.canonicalKey && (
        <button
          type="button"
          className="px-2 text-[10px] font-mono text-text-muted hover:text-white"
          aria-label={`Copy canonical ledger key ${row.canonicalKey}`}
          title={
            copyStatus === 'failed'
              ? 'Copy failed'
              : copyStatus === 'copied'
                ? 'Copied'
                : 'Copy canonical ledger key'
          }
          onClick={handleCopyCanonicalKey}
        >
          {copyStatus === 'failed'
            ? 'Copy failed'
            : copyStatus === 'copied'
              ? 'Copied'
              : 'Copy key'}
        </button>
      )}
    </div>
  )
}
