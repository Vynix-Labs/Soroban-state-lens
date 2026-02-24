/**
 * Resolves the diff status between two value
 *
 * @param prev - The previous value
 * @param next - The next value
 * @returns The diff status: 'added', 'removed', 'changed', or 'unchanged'
 */
export function resolveDiffStatus(
  prev: unknown,
  next: unknown,
): 'added' | 'removed' | 'changed' | 'unchanged' {
  // Handle null/undefined presence
  const prevIsNullish = prev === null || prev === undefined
  const nextIsNullish = next === null || next === undefined

  // If prev was nullish and next is not, it's added
  if (prevIsNullish && !nextIsNullish) {
    return 'added'
  }

  // If prev was not nullish and next is, it's removed
  if (!prevIsNullish && nextIsNullish) {
    return 'removed'
  }

  // If both are nullish, unchanged
  if (prevIsNullish && nextIsNullish) {
    return 'unchanged'
  }

  // Handle NaN transitions - NaN !== NaN, so we need special handling
  const prevIsNaN = typeof prev === 'number' && Number.isNaN(prev)
  const nextIsNaN = typeof next === 'number' && Number.isNaN(next)

  // If both are NaN, consider unchanged
  if (prevIsNaN && nextIsNaN) {
    return 'unchanged'
  }

  // If one is NaN and the other is not, it's changed
  if (prevIsNaN !== nextIsNaN) {
    return 'changed'
  }

  // Handle type flips - if types are different, it's changed
  if (typeof prev !== typeof next) {
    return 'changed'
  }

  // Shallow comparison for primitives and references
  if (prev === next) {
    return 'unchanged'
  }

  // If we reach here, values are different
  return 'changed'
}
