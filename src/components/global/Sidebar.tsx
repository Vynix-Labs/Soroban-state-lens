import { ChevronDown, ChevronRight, ChevronUp, Filter, GitCompare, History as HistoryIcon, PlusCircle, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useLensStore } from '../../store/lensStore'
import { resolveDiffStatus } from '../../lib/diff/resolveDiffStatus'

interface SidebarProps {
  open: boolean
  onClose: () => void
  variant?: 'overlay' | 'pinned'
  activeNavItem?: string
}

const EMPTY_ARRAY: Array<any> = []

export default function Sidebar({
  open,
  onClose,
  variant = 'overlay',
  activeNavItem = 'watchlist',
}: SidebarProps) {
  const isPinned = variant === 'pinned'
  const isHistory = activeNavItem === 'history'

  // Pinned variant: inline panel
  if (isPinned) {
    return (
      <aside
        className={`hidden lg:flex flex-col bg-background-dark border-r border-border-dark transition-all duration-300 ease-in-out ${
          open ? 'w-100 min-w-75' : 'w-0 min-w-0'
        } overflow-hidden shrink-0`}
        aria-label="Ledger State Explorer"
      >
        <div className="w-100 flex flex-col h-full">
          {/* Panel Header */}
          <div className="h-10 border-b border-border-dark flex items-center justify-between px-4 bg-surface-dark/50 shrink-0">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
              {isHistory ? 'Compare History' : 'Ledger State'}
            </span>
            {!isHistory && (
              <div className="flex gap-2">
                <button
                  className="text-text-muted hover:text-white"
                  aria-label="Collapse all"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  className="text-text-muted hover:text-white"
                  aria-label="Filter"
                >
                  <Filter size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
            {isHistory ? <HistoryPanel /> : <TreePlaceholder />}
          </div>
        </div>
      </aside>
    )
  }

  // For focus inside the sidebar
  const sidebarRef = useRef<HTMLElement | null>(null)

  // For focusing the opener button when the sidebar closes
  const openerRef = useRef<HTMLElement | null>(null)

  // When sidebar opens, save the focus, so when it closes we can return it
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement
    }
  }, [open])

  useEffect(() => {
    // store focus only when sidebar opens
    if (!open) return

    // Get all focusable elements inside the sidebar
    const container = sidebarRef.current
    if (!container) return

    const focusable = container.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )

    if (focusable.length === 0) return

    // get first and last focusable elements
    const first = focusable[0] as HTMLElement
    const last = focusable[focusable.length - 1] as HTMLElement

    // Focus first element when opened
    first.focus()

    // Handle keydown events for focus trapping and closing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes sidebar
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Trap focus (keyboard control)
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab (backward)
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          // Tab (forward)
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    // Attach event listener
    document.addEventListener('keydown', handleKeyDown)

    // cleanup or remove event listener when sidebar closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Return focus to opener when sidebar closes
  useEffect(() => {
    if (!open && openerRef.current) {
      openerRef.current.focus()
    }
  }, [open])

  // Overlay variant: mobile drawer
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-100 max-w-[85vw] bg-background-dark border-r border-border-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Ledger State Explorer"
      >
        {/* Panel Header */}
        <div className="h-10 border-b border-border-dark flex items-center justify-between px-4 bg-surface-dark/50 shrink-0">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
            {isHistory ? 'Compare History' : 'Ledger State'}
          </span>
          <div className="flex gap-2">
            {!isHistory && (
              <button
                className="text-text-muted hover:text-white"
                aria-label="Filter"
              >
                <Filter size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {isHistory ? <HistoryPanel /> : <TreePlaceholder />}
        </div>
      </aside>
    </>
  )
}

/**
 * History panel displaying snapshot history and latest compare diff counts
 */
function HistoryPanel() {
  const activeContractId = useLensStore((state) => state.activeContractId)
  const allSnapshots = useLensStore((state) => state.snapshots)
  
  const snapshots = useMemo(() => {
    if (!activeContractId) return EMPTY_ARRAY
    return allSnapshots[activeContractId] ?? EMPTY_ARRAY
  }, [allSnapshots, activeContractId])

  const addSnapshot = useLensStore((state) => state.addSnapshot)
  const removeSnapshot = useLensStore((state) => state.removeSnapshot)
  const clearSnapshots = useLensStore((state) => state.clearSnapshots)

  const ledgerData = useLensStore((state) => state.ledgerData)
  const ledgerEntries = useMemo(() => {
    if (!activeContractId) return EMPTY_ARRAY
    const entries = Object.values(ledgerData).filter(
      (entry) => entry.contractId === activeContractId,
    )
    return entries.sort((a, b) => a.key.localeCompare(b.key))
  }, [ledgerData, activeContractId])

  const handleCapture = () => {
    if (!activeContractId || ledgerEntries.length === 0) return
    const entriesDict: Record<string, typeof ledgerEntries[0]> = {}
    ledgerEntries.forEach((entry) => {
      entriesDict[entry.key] = entry
    })
    const label = `Snapshot #${snapshots.length + 1}`
    addSnapshot(activeContractId, entriesDict, label)
  }

  // Formatting helper for timestamps
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const hasInsufficient = snapshots.length < 2

  // Compute diff summary if 2 or more snapshots exist
  const diffSummary = useMemo(() => {
    if (snapshots.length < 2) return null

    const prev = snapshots[snapshots.length - 2]
    const next = snapshots[snapshots.length - 1]

    const prevKeys = Object.keys(prev.ledgerData)
    const nextKeys = Object.keys(next.ledgerData)
    const allKeys = Array.from(new Set([...prevKeys, ...nextKeys]))

    let created = 0
    let deleted = 0
    let modified = 0
    let unchanged = 0

    for (const key of allKeys) {
      const entryA = prev.ledgerData[key]
      const entryB = next.ledgerData[key]

      if (entryA === undefined && entryB !== undefined) {
        created++
      } else if (entryA !== undefined && entryB === undefined) {
        deleted++
      } else if (entryA !== undefined && entryB !== undefined) {
        const status = resolveDiffStatus(entryA.value, entryB.value)
        if (status === 'changed') {
          modified++
        } else {
          unchanged++
        }
      }
    }

    return {
      prevLabel: prev.label || `Snapshot #${snapshots.length - 1}`,
      nextLabel: next.label || `Snapshot #${snapshots.length}`,
      created,
      deleted,
      modified,
      unchanged,
      total: allKeys.length,
    }
  }, [snapshots])

  if (!activeContractId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 font-mono select-none">
        <HistoryIcon size={36} className="text-text-muted mb-4 opacity-40 animate-pulse" />
        <div className="text-white text-xs font-semibold uppercase tracking-wider mb-2">No Active Contract</div>
        <p className="text-[11px] text-text-muted max-w-[200px] leading-relaxed">
          Load a contract in the explorer first to inspect and track history.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 font-mono select-none">
      {hasInsufficient ? (
        // Empty State / Capture First View
        <div className="flex flex-col gap-4 p-4 bg-surface-dark/45 border border-border-dark/60 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <HistoryIcon size={16} className="animate-spin-slow" />
            <span>Capture First</span>
          </div>
          
          <p className="text-[11px] text-text-muted leading-relaxed">
            No history comparison available. Capture at least <strong>two</strong> snapshots of the contract state to compare and view changes.
          </p>
          
          <div className="flex items-center justify-between text-xs border-t border-border-dark/30 pt-3">
            <span className="text-text-muted">Snapshots captured:</span>
            <span className="text-white font-bold bg-white/5 border border-border-dark/60 px-2 py-0.5 rounded font-mono">
              {snapshots.length} / 2
            </span>
          </div>
          
          <button
            onClick={handleCapture}
            disabled={ledgerEntries.length === 0}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              ledgerEntries.length === 0
                ? 'bg-white/5 border border-border-dark/40 text-text-muted cursor-not-allowed opacity-50'
                : 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_15px_rgba(165,87,255,0.25)]'
            }`}
          >
            <PlusCircle size={14} />
            Capture Snapshot
          </button>
          
          {ledgerEntries.length === 0 && (
            <p className="text-[10px] text-amber-500/80 text-center leading-relaxed">
              * Query keys and load contract entries successfully to enable capturing.
            </p>
          )}
        </div>
      ) : (
        // Diff Summary Card (2 or more snapshots)
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-surface-dark border border-border-dark rounded-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-border-dark/50 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare size={14} className="text-primary" />
                Diff Summary
              </span>
              <span className="text-[10px] text-text-muted font-bold px-1.5 py-0.5 rounded bg-white/5 border border-border-dark/40">Compare</span>
            </div>
            
            <div className="text-xs text-text-muted flex items-center justify-between bg-background-dark/50 p-2 rounded-lg border border-border-dark/30">
              <span className="text-white font-semibold truncate max-w-[80px]" title={diffSummary?.prevLabel}>
                {diffSummary?.prevLabel}
              </span>
              <span className="text-text-muted font-bold">➔</span>
              <span className="text-white font-semibold truncate max-w-[80px]" title={diffSummary?.nextLabel}>
                {diffSummary?.nextLabel}
              </span>
            </div>

            {/* Counts Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col gap-0.5 hover:bg-green-500/15 transition-colors">
                <span className="text-green-400 font-bold text-base font-mono">+{diffSummary?.created}</span>
                <span className="text-[9px] text-green-300/80 uppercase font-bold tracking-wider">Created</span>
              </div>
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col gap-0.5 hover:bg-red-500/15 transition-colors">
                <span className="text-red-400 font-bold text-base font-mono">-{diffSummary?.deleted}</span>
                <span className="text-[9px] text-red-300/80 uppercase font-bold tracking-wider">Deleted</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col gap-0.5 hover:bg-amber-500/15 transition-colors">
                <span className="text-amber-400 font-bold text-base font-mono">~{diffSummary?.modified}</span>
                <span className="text-[9px] text-amber-300/80 uppercase font-bold tracking-wider">Modified</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-border-dark/50 flex flex-col gap-0.5 hover:bg-white/10 transition-colors">
                <span className="text-text-muted font-bold text-base font-mono">{diffSummary?.unchanged}</span>
                <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Unchanged</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleCapture}
                disabled={ledgerEntries.length === 0}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  ledgerEntries.length === 0
                    ? 'bg-white/5 border border-border-dark/40 text-text-muted cursor-not-allowed opacity-50'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-[0_0_15px_rgba(165,87,255,0.2)]'
                }`}
              >
                <PlusCircle size={12} />
                Capture
              </button>
              <button
                onClick={() => clearSnapshots(activeContractId)}
                className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Clear all snapshot history"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot List */}
      {snapshots.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 flex justify-between">
            <span>Captured History</span>
            <span className="text-primary font-bold">({snapshots.length})</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-border-dark/30 rounded-lg p-1.5 bg-background-dark/30">
            {snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-2.5 bg-surface-dark border border-border-dark/60 rounded-lg flex items-center justify-between text-xs hover:border-border-dark hover:bg-surface-dark/80 transition-all"
              >
                <div className="flex flex-col min-w-0 gap-0.5">
                  <span className="text-white font-medium truncate" title={snap.label}>
                    {snap.label || `Snapshot #${idx + 1}`}
                  </span>
                  <span className="text-[9px] text-text-muted flex gap-1.5 font-mono">
                    <span>{formatTime(snap.timestamp)}</span>
                    <span>•</span>
                    <span>{Object.keys(snap.ledgerData).length} keys</span>
                  </span>
                </div>
                <button
                  onClick={() => removeSnapshot(activeContractId, snap.id)}
                  className="text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                  title="Delete snapshot"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Placeholder tree content - will be replaced with actual tree component
 */
function TreePlaceholder() {
  return (
    <div className="space-y-1">
      {/* Expanded folder */}
      <div className="group">
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer text-white">
          <ChevronDown size={16} className="text-text-muted" />
          <span className="text-amber-500">📁</span>
          <span className="truncate">Contract_Registry</span>
        </div>
        <div className="pl-4 ml-2 border-l border-border-dark">
          <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer text-text-muted group/item">
            <span className="w-4" />
            <span className="text-blue-400">📄</span>
            <span className="flex-1 truncate group-hover/item:text-white">
              Registry_Config
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-dark border border-border-dark">
              Data
            </span>
          </div>
        </div>
      </div>

      {/* Collapsed folder */}
      <div className="group">
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer text-text-muted hover:text-white">
          <ChevronRight size={16} className="text-text-muted" />
          <span className="text-text-muted">📁</span>
          <span className="truncate">System_Contracts</span>
        </div>
      </div>

      {/* Another collapsed folder */}
      <div className="group">
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer text-text-muted hover:text-white">
          <ChevronRight size={16} className="text-text-muted" />
          <span className="text-text-muted">📁</span>
          <span className="truncate">WASM_Cache</span>
        </div>
      </div>
    </div>
  )
}
