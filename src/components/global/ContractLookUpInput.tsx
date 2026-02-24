import { useEffect, useRef, useState } from 'react'
import { validateContractId } from '../../lib/validation/contractId'

function ContractLookUpInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) {
      setValidationError('Please enter a contract ID')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const validationResult = await validateContractId(inputValue)

      if (!validationResult.ok) {
        setValidationError(validationResult.error || 'Invalid contract ID')
        return
      }

      // If validation passes, you can proceed with the lookup logic here
      console.log('Valid contract ID:', inputValue.trim())
      // TODO: Implement actual contract lookup logic
    } catch (error) {
      setValidationError('Validation failed. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl px-8 w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          className={`block w-full rounded-md border pr-12 py-2 pl-10 truncate md:pr-3 text-sm text-white placeholder-text-muted focus:ring-1 focus:outline-none transition-all font-mono ${
            validationError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-border-dark bg-background-dark focus:border-[#58a6ff] focus:ring-[#58a6ff]'
          }`}
          placeholder="Search ledger keys / contract IDs..."
          type="text"
          disabled={isValidating}
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
          {isValidating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#58a6ff]"></div>
          )}
          <kbd className="inline-flex items-center border border-border-dark rounded px-2 text-xs font-mono text-text-muted">
            ⌘K
          </kbd>
        </div>
      </div>
      {validationError && (
        <p className="mt-2 text-sm text-red-500">{validationError}</p>
      )}
    </form>
  )
}

export default ContractLookUpInput
