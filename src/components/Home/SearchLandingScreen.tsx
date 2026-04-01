import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { validateContractRouteParam } from '../../routes/contracts/$contractId/-validateContractRouteParam'
import WatermarkBg from './WatermarkBg'

const SearchLandingScreen = () => {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateContractRouteParam(inputValue)
    if (!result.ok) {
      setValidationError('Invalid contract ID')
      return
    }
    navigate({
      to: '/contracts/$contractId',
      params: { contractId: result.contractId },
    })
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 bg-grid-pattern z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d1117_90%)] z-0 pointer-events-none"></div>

      {/* <!-- Main Content Area --> */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4">
        {/* <!-- Center Container --> */}
        <div className="w-full max-w-[800px] flex flex-col items-center justify-center h-full relative mx-auto">
          {/* <!-- Watermark Logo (Behind) --> */}
          <WatermarkBg />
          {/* <!-- Content Wrapper --> */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center gap-8">
            {/* <!-- Heading --> */}
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-2 shadow-[0_0_20px_rgba(165,87,255,0.2)]">
                  <span className="material-symbols-outlined text-3xl">
                    view_in_ar
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                  SOROBAN STATE LENS
                </h1>
              </div>
              <p className="text-gray-400 max-w-[600px] mx-auto text-base md:text-lg leading-relaxed">
                A high-density blockchain state explorer for Soroban smart
                contracts. Explore storage, ledger entries, and transaction
                simulations in real-time.
              </p>
            </div>
            {/* <!-- Search Module --> */}
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[600px] group/search space-y-4"
            >
              <div className="text-center">
                <p className="text-primary/80 font-mono text-xs uppercase tracking-[0.2em] font-bold">
                  Enter a Contract ID to begin exploring
                </p>
              </div>
              <label className="flex flex-col w-full relative">
                {/* <!-- Glow Effect Container --> */}
                <div className="absolute -inset-0.5 bg-primary/20 rounded-lg blur opacity-0 group-focus-within/search:opacity-100 transition duration-500"></div>
                <div
                  className={`relative flex w-full items-center bg-background-dark border rounded-lg group-focus-within/search:shadow-[0_0_15px_rgba(165,87,255,0.2)] transition-all duration-300 h-14 overflow-hidden ${
                    validationError
                      ? 'border-red-500'
                      : 'border-border-dark group-focus-within/search:border-primary/60'
                  }`}
                >
                  <div className="pl-5 pr-3 text-gray-500">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    autoFocus={true}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (validationError) setValidationError(null)
                    }}
                    className="w-full bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 focus:outline-none font-mono text-sm h-full placeholder:font-mono"
                    placeholder="Search Contract ID (C...) or Ledger Key"
                    type="text"
                  />
                  <div className="pr-2 flex items-center">
                    <button
                      type="submit"
                      className="hidden md:inline-flex items-center justify-center px-2 py-1 border border-border-dark rounded text-[10px] text-gray-500 font-mono bg-surface-dark hover:border-primary/40 transition-colors"
                    >
                      /
                    </button>
                  </div>
                </div>
              </label>
              {validationError && (
                <p className="text-xs text-red-500 font-mono mt-1">
                  {validationError}
                </p>
              )}
            </form>
            {/* <!-- Quick Actions --> */}
            <div className="flex justify-center gap-3 w-full max-w-[600px] mx-auto text-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-[#1f262e] border border-border-dark hover:border-primary/40 rounded text-xs text-gray-300 font-mono font-medium transition-all group">
                <span className="material-symbols-outlined text-[16px] text-gray-500 group-hover:text-primary transition-colors">
                  wallet
                </span>
                <span className="text-xs">Connect Wallet</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-[#1f262e] border border-border-dark hover:border-primary/40 rounded text-xs text-gray-300 font-mono font-medium transition-all group">
                <span className="material-symbols-outlined text-[16px] text-gray-500 group-hover:text-primary transition-colors">
                  data_object
                </span>
                <span className="text-xs">Load Sample Contract</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-[#1f262e] border border-border-dark hover:border-primary/40 rounded text-xs text-gray-300 font-mono font-medium transition-all group">
                <span className="material-symbols-outlined text-[16px] text-gray-500 group-hover:text-primary transition-colors">
                  history
                </span>
                <span className="text-xs">Recent History</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* <!-- Footer Status Bar --> */}
      <footer className="relative z-10 w-full border-t border-border-dark bg-background-dark/80 backdrop-blur-sm">
        <div className="max-w-[960px] mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-mono text-gray-400">
              Mainnet Connected
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-mono text-gray-500">
              Latest Ledger:{' '}
              <span className="text-primary font-bold">894,221</span>
            </span>
            <span className="text-xs font-mono text-gray-500">
              TPS: <span className="text-white">142</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SearchLandingScreen
