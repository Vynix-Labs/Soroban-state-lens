import { ChevronDown, ChevronRight, ChevronUp, Filter, X } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
  variant?: 'overlay' | 'pinned'
}

export default function Sidebar({
  open,
  onClose,
  variant = 'overlay',
}: SidebarProps) {
  const isPinned = variant === 'pinned'

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
          <div className="h-10 border-b border-border-dark flex items-center justify-between px-4 bg-surface-dark/50">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
              Ledger State
            </span>
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
          </div>

          {/* Tree Content */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
            <TreePlaceholder />
          </div>
        </div>
      </aside>
    )
  }

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
        className={`fixed top-0 left-0 h-full w-100 max-w-[85vw] bg-background-dark border-r border-border-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Ledger State Explorer"
      >
        {/* Panel Header */}
        <div className="h-10 border-b border-border-dark flex items-center justify-between px-4 bg-surface-dark/50">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
            Ledger State
          </span>
          <div className="flex gap-2">
            <button
              className="text-text-muted hover:text-white"
              aria-label="Filter"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
          <TreePlaceholder />
        </div>
      </aside>
    </>
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
