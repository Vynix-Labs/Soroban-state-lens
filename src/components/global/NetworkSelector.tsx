import { useRef, useState } from 'react'

import { useLensStore } from '../../store/lensStore'
import { DEFAULT_NETWORKS } from '../../store/types'

import type { NetworkConfig } from '../../store/types'

type NetworkOption = 'mainnet' | 'testnet' | 'futurenet' | 'custom'

interface NetworkInfo {
  id: NetworkOption
  label: string
  config?: NetworkConfig
}

const NETWORK_OPTIONS: Array<NetworkInfo> = [
  { id: 'mainnet', label: 'Mainnet', config: DEFAULT_NETWORKS.mainnet },
  { id: 'testnet', label: 'Testnet', config: DEFAULT_NETWORKS.testnet },
  { id: 'futurenet', label: 'Futurenet', config: DEFAULT_NETWORKS.futurenet },
  { id: 'custom', label: 'Custom' },
]

export default function NetworkSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const networkConfig = useLensStore((state) => state.networkConfig)
  const setNetworkConfig = useLensStore((state) => state.setNetworkConfig)

  // Determine current selection based on networkId
  const currentNetwork =
    NETWORK_OPTIONS.find((opt) => opt.id === networkConfig.networkId) ||
    NETWORK_OPTIONS.find((opt) => opt.id === 'custom')!

  const handleSelect = (option: NetworkInfo) => {
    if (option.config) {
      setNetworkConfig(option.config)
    } else {
      // Custom: just set the networkId, keep other config
      setNetworkConfig({ networkId: 'custom' })
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionKeyDown = (e: React.KeyboardEvent, option: NetworkInfo) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(option)
    }
  }

  // Close dropdown when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative" onBlur={handleBlur}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-dark bg-background-dark hover:border-primary/50 hover:bg-primary/10 transition-colors text-sm font-medium "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select network"
      >
        <span
          className={`size-2 rounded-full ${
            currentNetwork.id === 'mainnet'
              ? 'bg-emerald-500'
              : currentNetwork.id === 'testnet'
                ? 'bg-amber-500'
                : currentNetwork.id === 'futurenet'
                  ? 'bg-blue-500'
                  : 'bg-purple-500'
          }`}
        />
        <span className="text-white">{currentNetwork.label}</span>
        <span className="material-symbols-outlined text-text-muted text-[18px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-40 bg-surface-dark border border-border-dark rounded-lg shadow-lg overflow-hidden z-50"
          role="listbox"
          aria-label="Network options"
        >
          {NETWORK_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={currentNetwork.id === option.id}
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => handleOptionKeyDown(e, option)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors ${
                currentNetwork.id === option.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-main'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  option.id === 'mainnet'
                    ? 'bg-emerald-500'
                    : option.id === 'testnet'
                      ? 'bg-amber-500'
                      : option.id === 'futurenet'
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                }`}
              />
              <span>{option.label}</span>
              {currentNetwork.id === option.id && (
                <span className="material-symbols-outlined text-[16px] ml-auto">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
