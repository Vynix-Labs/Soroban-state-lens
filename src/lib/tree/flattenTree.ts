import type { Node } from '../../types/node'
import type { FlatTreeRow, FlattenTreeRoot } from './flatTreeRow'

function isExpandable(node: Node): boolean {
  return node.kind === 'vec' || node.kind === 'map'
}

function getChildren(node: Node): Array<{ idPart: string; label: string; node: Node }> {
  if (node.kind === 'vec') {
    return node.items.map((child, index) => ({
      idPart: `item-${index}`,
      label: `[${index}]`,
      node: child,
    }))
  }

  if (node.kind === 'map') {
    return node.entries.flatMap((entry, index) => {
      return [
        {
          idPart: `entry-${index}-key`,
          label: `entry[${index}].key`,
          node: entry.key,
        },
        {
          idPart: `entry-${index}-value`,
          label: `entry[${index}].value`,
          node: entry.value,
        },
      ]
    })
  }

  return []
}

function walkNode(params: {
  rows: Array<FlatTreeRow>
  node: Node
  id: string
  parentId: string | null
  depth: number
  label: string
  expandedIds: Set<string>
}): void {
  const { rows, node, id, parentId, depth, label, expandedIds } = params
  const children = getChildren(node)

  rows.push({
    id,
    parentId,
    depth,
    keyPath: id,
    label,
    kind: node.kind,
    hasChildren: children.length > 0,
    childCount: children.length,
    node,
  })

  if (!isExpandable(node) || !expandedIds.has(id)) {
    return
  }

  for (const child of children) {
    const childId = `${id}.${child.idPart}`
    walkNode({
      rows,
      node: child.node,
      id: childId,
      parentId: id,
      depth: depth + 1,
      label: child.label,
      expandedIds,
    })
  }
}

export function flattenTree(
  roots: Array<FlattenTreeRoot>,
  expandedNodeIds: ReadonlyArray<string> | Set<string>,
): Array<FlatTreeRow> {
  const rows: Array<FlatTreeRow> = []
  const expandedIds =
    expandedNodeIds instanceof Set
      ? expandedNodeIds
      : new Set<string>(expandedNodeIds)

  for (const root of roots) {
    walkNode({
      rows,
      node: root.node,
      id: root.id,
      parentId: null,
      depth: 0,
      label: root.label,
      expandedIds,
    })
  }

  return rows
}

/**
 * Returns every expandable node id in the supplied roots, regardless of the
 * current expansion state. Used to drive expand-all controls for the explorer.
 */
export function collectExpandableNodeIds(
  roots: Array<FlattenTreeRoot>,
): Array<string> {
  const ids: Array<string> = []

  const visit = (node: Node, id: string): void => {
    const children = getChildren(node)
    if (isExpandable(node) && children.length > 0) {
      ids.push(id)
      for (const child of children) {
        visit(child.node, `${id}.${child.idPart}`)
      }
    }
  }

  for (const root of roots) {
    visit(root.node, root.id)
  }

  return ids
}
