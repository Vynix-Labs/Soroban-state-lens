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
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customRpcUrl, setCustomRpcUrl] = useState('')
  const [validationError, setValidationError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const networkConfig = useLensStore((state) => state.networkConfig)
  const setNetworkConfig = useLensStore((state) => state.setNetworkConfig)

  // Determine current selection based on networkId
  const currentNetwork =
    NETWORK_OPTIONS.find((opt) => opt.id === networkConfig.networkId) ||
    NETWORK_OPTIONS.find((opt) => opt.id === 'custom')!

  const handleSelect = (option: NetworkInfo) => {
    if (option.config) {
      setNetworkConfig(option.config)
      setShowCustomInput(false)
      setValidationError('')
      setCustomRpcUrl('')
    } else {
      // Custom: show input field
      setShowCustomInput(true)
      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 0)
    }
    setIsOpen(false)
  }

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setCustomRpcUrl(url)

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('')
    }
  }

  const handleCustomUrlBlur = () => {
    if (customRpcUrl.trim()) {
      const validation = validateRpcUrl(customRpcUrl)
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid URL')
      }
    }
  }

  const handleApplyCustomUrl = () => {
    const validation = validateRpcUrl(customRpcUrl)
    if (validation.isValid) {
      setNetworkConfig({
        networkId: 'custom',
        rpcUrl: customRpcUrl.trim(),
        networkPassphrase: 'Custom Network', // Default passphrase
      })
      setShowCustomInput(false)
      setValidationError('')
      setCustomRpcUrl('')
    } else {
      setValidationError(validation.error || 'Invalid URL')
    }
  }

  const handleCancelCustom = () => {
    setShowCustomInput(false)
    setCustomRpcUrl('')
    setValidationError('')
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

      {/* Custom RPC Input */}
      {showCustomInput && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-surface-dark border border-border-dark rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-main">
                Custom RPC URL
              </h3>
              <button
                type="button"
                onClick={handleCancelCustom}
                className="text-text-muted hover:text-text-main transition-colors"
                aria-label="Cancel custom RPC"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={customRpcUrl}
                onChange={handleCustomUrlChange}
                onBlur={handleCustomUrlBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyCustomUrl()
                  } else if (e.key === 'Escape') {
                    handleCancelCustom()
                  }
                }}
                placeholder="https://rpc.example.com"
                className={`w-full px-3 py-2 bg-background-dark border rounded-md text-sm text-white placeholder-text-muted transition-colors ${
                  validationError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-border-dark focus:border-primary'
                } focus:outline-none focus:ring-1 focus:ring-primary/20`}
                aria-label="Custom RPC URL input"
                aria-invalid={!!validationError}
                aria-describedby={validationError ? 'rpc-error' : undefined}
              />

              {validationError && (
                <p
                  id="rpc-error"
                  className="text-xs text-red-400 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    error
                  </span>
                  {validationError}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelCustom}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customRpcUrl.trim() || !!validationError}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && !showCustomInput && (
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
