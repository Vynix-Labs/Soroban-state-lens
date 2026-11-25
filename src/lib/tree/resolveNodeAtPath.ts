import type { Node } from '../../types/node'

/** Resolve an Explorer tree row ID back to its decoded node. */
export function resolveNodeAtPath(
  root: Node,
  rootId: string,
  nodeId: string,
): Node | undefined {
  if (nodeId === rootId) return root
  const prefix = `${rootId}.`
  if (!nodeId.startsWith(prefix)) return undefined

  let node = root
  for (const segment of nodeId.slice(prefix.length).split('.')) {
    const vectorMatch = /^item-(\d+)$/.exec(segment)
    if (vectorMatch && node.kind === 'vec') {
      const index = Number(vectorMatch[1])
      if (!Object.prototype.hasOwnProperty.call(node.items, index)) {
        return undefined
      }
      node = node.items[index]
      continue
    }

    const mapMatch = /^entry-(\d+)-(key|value)$/.exec(segment)
    if (mapMatch && node.kind === 'map') {
      const index = Number(mapMatch[1])
      if (!Object.prototype.hasOwnProperty.call(node.entries, index)) {
        return undefined
      }
      const entry = node.entries[index]
      node = mapMatch[2] === 'key' ? entry.key : entry.value
      continue
    }

    return undefined
  }

  return node
}
