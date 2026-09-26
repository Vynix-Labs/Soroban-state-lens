const INVALID_BIG_INT_FALLBACK = '-'

/**
 * Formats an integer with deterministic three-digit grouping.
 *
 * `Intl` is intentionally avoided so explorer output does not change with the
 * host locale. Number inputs must be safe integers because lost precision
 * cannot be recovered during formatting.
 */
export function formatBigInt(value: string | number | bigint): string {
  if (typeof value === 'string' && value.trim() === '') {
    return INVALID_BIG_INT_FALLBACK
  }

  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    return INVALID_BIG_INT_FALLBACK
  }

  try {
    const normalized = BigInt(value).toString()
    const isNegative = normalized.startsWith('-')
    const digits = isNegative ? normalized.slice(1) : normalized
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return isNegative ? `-${grouped}` : grouped
  } catch {
    return INVALID_BIG_INT_FALLBACK
  }
}
