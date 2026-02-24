/**
 * Builds a stable, sanitized ledger entry map key.
 *
 * Format: `contract::entryType::keyPart`
 *
 * Requirements:
 * - Each component is trimmed before joining.
 * - Throws an Error if any component is empty after trimming.
 * - Returns a deterministic string suitable for use as a map key.
 *
 * @param contractId The contract identifier.
 * @param entryType The ledger entry type.
 * @param keyPart The specific key part within the entry.
 * @returns A formatted ledger entry key string.
 */
export function makeLedgerEntryKey(
  contractId: string,
  entryType: string,
  keyPart: string,
): string {
  const trimmedContract = sanitize(contractId, 'contractId')
  const trimmedType = sanitize(entryType, 'entryType')
  const trimmedKey = sanitize(keyPart, 'keyPart')

  return `${trimmedContract}::${trimmedType}::${trimmedKey}`
}

function sanitize(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`)
  }
  return value.trim()
}
