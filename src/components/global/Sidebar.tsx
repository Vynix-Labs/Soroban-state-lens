import { ChevronDown, ChevronRight, ChevronUp, Filter, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

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

  // For focus inside the sidebar
  const sidebarRef = useRef<HTMLElement | null>(null)

  // For focusing the opener button when the sidebar closes
  const openerRef = useRef<HTMLElement | null>(null)

  // Whwn sidebar opens , save the focus , so when it closes we can return it
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

    // Attach event listerner
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
