import ContractLookUpInput from './ContractLookUpInput'
import NetworkSelector from './NetworkSelector'

interface HeaderProp {
  handleToggle: () => void
}

export default function Header({ handleToggle }: HeaderProp) {
  return (
    <>
      <header className="h-15 min-h-15 bg-surface-dark border-b border-border-dark flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="size-8 bg-primary/20 rounded flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined">view_in_ar</span>
          </button>
          <h1 className="font-mono font-bold text-white hidden xl:text-lg tracking-tight xl:flex">
            SOROBAN STATE LENS
          </h1>
        </div>

        {/* Center: Search Input */}
        <div className="hidden md:flex w-full max-w-xl">
          <ContractLookUpInput />
        </div>

        {/* Right: Network Selector  */}
        <div className="flex items-center gap-3">
          <NetworkSelector />
        </div>
      </header>
    </>
  )
}
