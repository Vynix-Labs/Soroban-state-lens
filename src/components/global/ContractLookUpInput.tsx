import { useEffect, useRef } from 'react'

function ContractLookUpInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // ⌘K on Mac or Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [])
  return (
    <div className="flex-1 max-w-xl px-8 w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          ref={inputRef}
          className="block w-full rounded-md border border-border-dark bg-background-dark pr-12 py-2 pl-10 truncate md:pr-3 text-sm text-white placeholder-text-muted focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] focus:outline-none transition-all font-mono "
          placeholder="Search ledger keys / contract IDs..."
          type="text"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
          <kbd className="inline-flex items-center border border-border-dark rounded px-2 text-xs font-mono text-text-muted">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  )
}

export default ContractLookUpInput
