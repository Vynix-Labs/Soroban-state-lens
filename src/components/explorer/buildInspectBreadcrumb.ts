import { parseTreeNodePath } from '../../lib/tree/parseTreeNodePath'
import { formatContractIdShort } from '../../lib/format/formatContractIdShort'

export interface BreadcrumbSegment {
  /** Display label for the breadcrumb segment. */
  label: string
  /** Title attribute / full value for tooltips on truncated segments. */
  title?: string
}

export interface InspectBreadcrumb {
  segments: Array<BreadcrumbSegment>
}

/**
 * Maximum number of characters shown for a key-path segment before it is
 * middle-truncated. Long Soroban key paths (e.g. nested map keys encoded as
 * base64) would otherwise blow out the breadcrumb width and wrap awkwardly.
 */
const MAX_SEGMENT_LENGTH = 24

function truncateSegment(value: string): BreadcrumbSegment {
  if (value.length <= MAX_SEGMENT_LENGTH) {
    return { label: value }
  }
  const head = value.slice(0, 11)
  const tail = value.slice(value.length - 8)
  return { label: `${head}…${tail}`, title: value }
}

/**
 * Builds a breadcrumb trail for the inspect header from the contract ID and
 * the dot-joined escaped key path. The contract ID is shortened for display
 * while the full value is surfaced as a tooltip; key-path segments are
 * parsed with the shared tree path parser so escapes round-trip correctly.
 */
export function buildInspectBreadcrumb(
  contractId: string,
  keyPath: string,
): InspectBreadcrumb {
  const contractLabel = formatContractIdShort(contractId)
  const contractSegment: BreadcrumbSegment =
    contractLabel === '-'
      ? { label: 'Contract' }
      : { label: contractLabel, title: contractId || undefined }

  const keySegments = parseTreeNodePath(keyPath)

  // An empty path or a clearly invalid path (trailing backslash) parses to
  // an empty array — show a neutral "Root" segment so the trail is never blank.
  if (keySegments.length === 0) {
    return {
      segments: [contractSegment, { label: keyPath ? 'Root' : 'No key' }],
    }
  }

  return {
    segments: [
      contractSegment,
      ...keySegments.map((segment) => truncateSegment(segment)),
    ],
  }
}