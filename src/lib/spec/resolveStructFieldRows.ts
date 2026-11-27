import type { ContractSpecStruct } from '../../types/contract-spec'
import type { Node } from '../../types/node'

export interface StructFieldRow {
  label: string
  keyPath: string
  node: Node
}

/** Scalar leaves retain their raw paths; labels apply only after an explicit choice. */
export function resolveStructFieldRows(
  collection: Node,
  struct: ContractSpecStruct,
  keyPath: string,
): Array<StructFieldRow> | undefined {
  if (collection.kind !== 'vec' || (collection.omittedChildren ?? 0) > 0)
    return undefined
  const names = struct.fields.map((field) => {
    const name = field.name()
    return typeof name === 'string' ? name : new TextDecoder().decode(name)
  })
  if (new Set(names).size !== names.length) return undefined
  if (
    collection.items.length > 0 &&
    collection.items.every((item) => item.kind === 'map')
  ) {
    const rows: Array<StructFieldRow> = []
    for (const [itemIndex, item] of collection.items.entries()) {
      if (
        (item.omittedChildren ?? 0) > 0 ||
        item.entries.length !== names.length
      )
        return undefined
      const seen = new Set<string>()
      for (const [fieldIndex, field] of item.entries.entries()) {
        if (
          field.key.kind !== 'primitive' ||
          (field.key.scType !== 'symbol' && field.key.scType !== 'string') ||
          typeof field.key.value !== 'string' ||
          !names.includes(field.key.value) ||
          seen.has(field.key.value)
        )
          return undefined
        seen.add(field.key.value)
        rows.push({
          label: field.key.value,
          keyPath: `${keyPath}.item-${itemIndex}.entry-${fieldIndex}-value`,
          node: field.value,
        })
      }
    }
    return rows
  }
  const leaves: Array<{ keyPath: string; node: Node }> = []
  const visit = (node: Node, path: string): boolean => {
    if (node.kind === 'vec') {
      return (
        (node.omittedChildren ?? 0) === 0 &&
        node.items.length > 0 &&
        node.items.every((child, index) =>
          visit(child, `${path}.item-${index}`),
        )
      )
    }
    if (node.kind !== 'primitive' && node.kind !== 'address') return false
    leaves.push({ keyPath: path, node })
    return true
  }
  if (!visit(collection, keyPath) || leaves.length !== names.length)
    return undefined
  return leaves.map((leaf, index) => ({ ...leaf, label: names[index] }))
}
