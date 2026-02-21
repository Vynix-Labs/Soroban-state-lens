import { useEffect, useRef, useState } from 'react'

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
  const [customUrl, setCustomUrl] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const networkConfig = useLensStore((state) => state.networkConfig)
  const lastCustomUrl = useLensStore((state) => state.lastCustomUrl)
  const setNetworkConfig = useLensStore((state) => state.setNetworkConfig)
  const setLastCustomUrl = useLensStore((state) => state.setLastCustomUrl)

  // Hydration effect: initialize state from persisted storage
  useEffect(() => {
    setIsHydrated(true)

    // If currently on custom network and we have a last custom URL, sync it
    if (networkConfig.networkId === 'custom' && lastCustomUrl) {
      setCustomUrl(lastCustomUrl)
      setShowCustomInput(true)
    } else if (networkConfig.networkId === 'custom') {
      // If custom but no last URL, use current config URL
      setCustomUrl(networkConfig.rpcUrl || '')
      setShowCustomInput(true)
    }
  }, [networkConfig.networkId, lastCustomUrl, networkConfig.rpcUrl])

  // Don't render until hydrated to prevent SSR mismatches
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-dark bg-background-dark text-sm font-medium">
        <span className="text-white">Loading...</span>
      </div>
    )
  }

  // Determine current selection based on networkId
  const currentNetwork =
    NETWORK_OPTIONS.find((opt) => opt.id === networkConfig.networkId) ||
    NETWORK_OPTIONS.find((opt) => opt.id === 'custom')!

  // Initialize custom URL when switching to custom mode
  const handleSelect = (option: NetworkInfo) => {
    if (option.config) {
      // Preset network: clear any custom URL usage
      setNetworkConfig(option.config)
      setShowCustomInput(false)
    } else {
      // Custom: restore last custom URL or set up for new input
      const urlToUse = lastCustomUrl || networkConfig.rpcUrl || ''
      setNetworkConfig({
        networkId: 'custom',
        networkPassphrase: '', // Will be set when URL is validated
        rpcUrl: urlToUse,
      })
      setCustomUrl(urlToUse)
      setShowCustomInput(true)
    }
    setIsOpen(false)
  }

  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url)
    // Update network config immediately for real-time feedback
    setNetworkConfig({
      networkId: 'custom',
      networkPassphrase: networkConfig.networkPassphrase,
      rpcUrl: url,
    })
  }

  const handleCustomUrlBlur = () => {
    if (customUrl.trim()) {
      setLastCustomUrl(customUrl.trim())
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
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
          className="absolute right-0 top-full mt-1 w-64 bg-surface-dark border border-border-dark rounded-lg shadow-lg overflow-hidden z-50"
          role="listbox"
          aria-label="Network options"
        >
          {NETWORK_OPTIONS.map((option) => (
            <div key={option.id}>
              <button
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

              {/* Custom URL Input */}
              {option.id === 'custom' &&
                currentNetwork.id === 'custom' &&
                showCustomInput && (
                  <div className="px-3 pb-3 border-t border-border-dark">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => handleCustomUrlChange(e.target.value)}
                      onBlur={handleCustomUrlBlur}
                      placeholder="https://your-rpc-url.com"
                      className={`w-full mt-2 px-3 py-2 bg-background-dark border rounded-md text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        customUrl && !isValidUrl(customUrl)
                          ? 'border-red-500 focus:ring-red-500/50'
                          : 'border-border-dark'
                      }`}
                    />
                    {customUrl && !isValidUrl(customUrl) && (
                      <p className="mt-1 text-xs text-red-400">
                        Please enter a valid URL (http:// or https://)
                      </p>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
