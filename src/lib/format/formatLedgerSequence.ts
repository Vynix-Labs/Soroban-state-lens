/**
 * Formats a ledger sequence number for display.
 * Groups thousands (e.g., 1,234,567) and returns a dash "-" for invalid values.
 *
 * @param value - The ledger sequence (positive number, bigint, or numeric string).
 * @returns The formatted string or "-".
 */
export function formatLedgerSequence(value: number | bigint | string): string {
  try {
    // Handle empty strings explicitly as they would otherwise be parsed as 0
    if (typeof value === 'string' && value.trim() === '') {
      return '-'
    }

    const n = BigInt(value)

    // Ledger sequences must be positive
    if (n <= 0n) {
      return '-'
    }

    // Manual thousands grouper to ensure locale stability without Intl dependency
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  } catch {
    // Fallback for invalid numeric types or malformed strings
    return '-'
  }
}
