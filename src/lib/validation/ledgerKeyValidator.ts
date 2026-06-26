/**
 * Synchronous ledger key validator that validates the serialized ledger entry key
 * format used by `makeLedgerEntryKey` / `parseLedgerEntryKey`.
 *
 * Expected format: `contractId::entryType::keyPart`
 */
import { parseLedgerEntryKey } from '../storage/parseLedgerEntryKey'

export interface LedgerKeyValidatorResult {
  valid: boolean
  error?: string
}

/**
 * Validates a serialized ledger key string.
 *
 * @param input Serialized ledger key string.
 */
export function ledgerKeyValidator(input: string): LedgerKeyValidatorResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' }
  }

  if (input.trim() === '') {
    return { valid: false, error: 'Ledger key cannot be blank' }
  }

  const parsed = parseLedgerEntryKey(input)
  if (!parsed) {
    return {
      valid: false,
      error:
        'Invalid ledger key. Expected format: contractId::entryType::keyPart',
    }
  }

  return { valid: true }
}

