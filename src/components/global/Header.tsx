import ContractLookUpInput from './ContractLookUpInput'

interface HeaderProp {
  handleToggle: () => void
}

export default function Header({ handleToggle }: HeaderProp) {
  return (
    <>
      <header className="h-15 min-h-15 bg-surface-dark border-b border-border-dark flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="size-8 bg-primary/20 rounded flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined">view_in_ar</span>
          </button>
          <h1 className="font-mono font-bold text-white hidden  xl:text-lg tracking-tight  xl:flex">
            SOROBAN STATE LENS
          </h1>
        </div>
        <div className="hidden md:flex w-full max-w-xl">
          <ContractLookUpInput />
        </div>
        <button className=" items-center gap-2 px-4 py-1.5 rounded-full border border-border-dark bg-background-dark flex hover:border-primary/50 hover:bg-primary/10 transition-colors group">
          <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-sm font-medium text-white group-hover:text-primary">
            Connect
          </span>
        </button>
      </header>
    </>
  )
}
