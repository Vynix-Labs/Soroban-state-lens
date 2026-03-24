import type { LedgerEntry, LensStore } from '../../store/types'

/**
 * Selects a single ledger entry by its unique key.
 *
 * Requirements:
 * - Reads one ledger entry by key from state without mutation.
 * - Returns undefined for empty keys or missing map entries.
 *
 * @param state The full LensStore state.
 * @param key The ledger entry key to look up.
 * @returns The matching LedgerEntry or undefined if not found.
 */
export function selectLedgerEntryByKey(
  state: LensStore,
  key: string,
): LedgerEntry | undefined {
  if (typeof key !== 'string' || key.trim() === '') {
    return undefined
  }

  return state.ledgerData[key]
}
