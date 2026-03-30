/**
 * Formats a Soroban contract ID or address into a shortened version
 * e.g., "CB7...ABCD"
 *
 * @param contractId The full contract ID or address
 * @param head Number of characters at the start
 * @param tail Number of characters at the end
 * @returns Shortened string or "-" if invalid/blank
 */
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

  const length = contractId.length
  if (length <= head + tail) {
    return contractId
  }

  const firstPart = contractId.substring(0, head)
  const lastPart = contractId.substring(length - tail)

  return `${firstPart}...${lastPart}`
}
