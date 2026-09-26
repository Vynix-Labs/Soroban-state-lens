/**
 * Formats a Soroban contract ID or address into a shortened version
 * e.g., "CB7...ABCD"
 *
 * @param contractId The full contract ID or address
 * @param head Number of characters at the start
 * @param tail Number of characters at the end
 * @returns Shortened string or "-" if invalid/blank
 */
function normalizeLength(value: unknown, fallback: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    return fallback
  }

  return Math.floor(value)
}

export function formatContractIdShort(
  contractId: string,
  head = 6,
  tail = 4,
): string {
  if (
    !contractId ||
    typeof contractId !== 'string' ||
    contractId.trim() === ''
  ) {
    return '-'
  }

  const normalizedHead = normalizeLength(head, 6)
  const normalizedTail = normalizeLength(tail, 4)
  const length = contractId.length

  if (length <= normalizedHead + normalizedTail) {
    return contractId
  }

  const firstPart = contractId.substring(0, normalizedHead)
  const lastPart = contractId.substring(length - normalizedTail)

  return `${firstPart}...${lastPart}`
}
