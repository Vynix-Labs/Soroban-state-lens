import { collectExpandableNodeIds, flattenTree } from '../tree/flattenTree'
import type { Node } from '../../types/node'
import type { StructFieldRow } from './resolveStructFieldRows'

/** Bounded raw labels use the same stable paths as Explorer. */
export function rawInspectorFields(
  node: Node,
  keyPath: string,
): Array<StructFieldRow> {
  const roots = [{ id: keyPath, label: keyPath, node }]
  return flattenTree(roots, collectExpandableNodeIds(roots))
    .filter((row) => !row.hasChildren && row.id !== keyPath)
    .slice(0, 100)
    .map((row) => ({ label: row.label, keyPath: row.keyPath, node: row.node }))
}
