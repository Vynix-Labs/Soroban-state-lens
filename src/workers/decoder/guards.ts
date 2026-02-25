/**
 * Cycle detection and visited-node tracking for recursive normalization
 * Prevents infinite recursion from cyclic object references
 */

import type { NormalizedTruncated } from '../../types/normalized'

/**
 * Visited node tracker for cycle detection
 * Uses object identity to track which objects have already been visited
 * during the current normalization pass
 */
export class VisitedTracker {
  /**
   * Array storing visited objects
   * Uses object identity (reference equality) for tracking
   */
  private visitedObjects: Array<object>

  constructor() {
    this.visitedObjects = []
  }

  /**
   * Check if an object has been visited
   */
  hasVisited(obj: unknown): boolean {
    if (obj === null || obj === undefined) {
      return false
    }

    // Only track objects - primitives can be visited multiple times
    if (typeof obj !== 'object') {
      return false
    }

    // Check if object is in visited list using reference equality
    return this.visitedObjects.includes(obj)
  }

  /**
   * Mark an object as visited
   */
  markVisited(obj: unknown): void {
    if (obj === null || obj === undefined) {
      return
    }

    // Only track objects - primitives don't need tracking
    if (typeof obj !== 'object') {
      return
    }

    // Add to visited list if not already present
    if (!this.visitedObjects.includes(obj)) {
      this.visitedObjects.push(obj)
    }
  }

  /**
   * Create a cycle marker to return when a cycle is detected
   */
  static createCycleMarker(depth?: number): NormalizedTruncated {
    return {
      kind: 'truncated',
      depth,
    }
  }

  /**
   * Check if a value is a cycle marker
   */
  static isCycleMarker(value: unknown): value is NormalizedTruncated {
    return (
      typeof value === 'object' &&
      value !== null &&
      'kind' in value &&
      (value as Record<string, unknown>).kind === 'truncated'
    )
  }

  /**
   * Get current depth/size of visited tracker
   */
  getDepth(): number {
    return this.visitedObjects.length
  }

  /**
   * Create a copy of this tracker for nested calls (optional - for detailed tracking)
   */
  snapshot(): Array<object> {
    return [...this.visitedObjects]
  }
}

/**
 * Creates a new visited tracker for cycle detection
 */
export function createVisitedTracker(): VisitedTracker {
  return new VisitedTracker()
}
