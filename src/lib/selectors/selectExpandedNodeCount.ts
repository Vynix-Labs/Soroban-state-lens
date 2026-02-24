import type { LensStore } from '../../store/types'

/**
 * Returns the count of unique expanded node IDs in state.
 *
 * Requirements:
 * - Returns the number of unique entries in expandedNodes.
 * - Defensively returns 0 if expandedNodes is not a valid array.
 *
 * @param state The full LensStore state.
 * @returns The count of unique expanded node IDs.
 */
export function selectExpandedNodeCount(state: LensStore): number {
  if (!Array.isArray(state.expandedNodes)) {
    return 0
  }

  return new Set(state.expandedNodes).size
}
