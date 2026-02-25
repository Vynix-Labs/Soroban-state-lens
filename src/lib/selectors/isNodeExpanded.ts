import type { LensStore } from '../../store/types'

/**
 * Checks if a node is currently expanded in the tree view
 *
 * @param state - The lens store state
 * @param nodeId - The node identifier to check
 * @returns true if the node is expanded, false otherwise
 */
export function isNodeExpanded(state: LensStore, nodeId: string): boolean {
  // Handle blank nodeId
  if (!nodeId || nodeId.trim() === '') {
    return false
  }

  // Check if nodeId exists in expandedNodes array
  return state.expandedNodes.includes(nodeId)
}
