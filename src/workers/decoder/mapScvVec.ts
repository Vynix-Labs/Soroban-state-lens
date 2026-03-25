/**
 * Maps each item in a Soroban vector through the provided normalize callback,
 * preserving insertion order.
 *
 * Non-array input is treated as an empty array.
 * If the callback throws for a given item, that item is replaced with null.
 */
export function mapScvVec(
  items: Array<unknown>,
  normalize: (item: unknown) => unknown,
): Array<unknown> {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => {
    try {
      return normalize(item)
    } catch {
      return null
    }
  })
}
