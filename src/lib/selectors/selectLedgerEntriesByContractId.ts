import type { LedgerEntry, LensStore } from '../../store/types'

/**
 * Selects all ledger entries matching a given contract ID.
 *
 * Requirements:
 * - Filters ledgerData entries by exact contractId match.
 * - Returns results sorted deterministically by entry key (ascending).
 * - Returns an empty array for unknown, empty, or blank contract IDs.
 *
 * @param state The full LensStore state.
 * @param contractId The contract ID to filter by.
 * @returns Sorted array of matching LedgerEntry objects.
 */
export function selectLedgerEntriesByContractId(
  state: LensStore,
  contractId: string,
): Array<LedgerEntry> {
  if (typeof contractId !== 'string' || contractId.trim() === '') {
    return []
  }

  const entries = Object.values(state.ledgerData).filter(
    (entry) => entry.contractId === contractId,
  )

  return entries.sort((a, b) => a.key.localeCompare(b.key))
}
