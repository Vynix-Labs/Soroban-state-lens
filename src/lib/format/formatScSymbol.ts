/**
 * Safely formats a symbol string.
 *
 * Rules:
 * - Trims whitespace
 * - Returns "?" for empty/invalid input
 * - Returns "?" if control characters are present
 * - Otherwise returns the cleaned string
 */
export function formatScSymbol(value: string): string {
  if (typeof value !== 'string') {
    return '?'
  }
  // 🚨 Check control characters FIRST (before trim)

  // 🚨 Detect control characters WITHOUT regex
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 31 || code === 127) {
      return '?'
    }
  }

  const trimmed = value.trim()

  // Empty after trimming
  if (!trimmed) {
    return '?'
  }

  return trimmed
}
