/**
 * Parses a serialized ledger entry key back into its components.
 *
 * Expected format: `contractId::entryType::keyPart`
 *
 * Requirements:
 * - Returns the three components as an object, or null if malformed.
 * - Rejects keys with extra separators (more than 3 segments).
 * - Rejects keys with blank segments after trimming.
 * - Rejects empty or non-string input.
 *
 * @param key The serialized ledger entry key string.
 * @returns Parsed components or null if the key is malformed.
 */
export function parseLedgerEntryKey(
  key: string,
): { contractId: string; entryType: string; keyPart: string } | null {
  if (typeof key !== 'string' || key.trim() === '') {
    return null
  }

  const parts = key.split('::')

  if (parts.length !== 3) {
    return null
  }

  const contractId = parts[0].trim()
  const entryType = parts[1].trim()
  const keyPart = parts[2].trim()

  if (contractId === '' || entryType === '' || keyPart === '') {
    return null
  }

  return { contractId, entryType, keyPart }
}
