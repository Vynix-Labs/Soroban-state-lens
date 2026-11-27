import type { ContractSpecStruct } from '../../types/contract-spec'
import type { MapNode, Node } from '../../types/node'

function getMapFieldNames(map: MapNode): Set<string> | undefined {
  if ((map.omittedChildren ?? 0) > 0) return undefined

  const names = new Set<string>()
  for (const entry of map.entries) {
    if (
      entry.key.kind !== 'primitive' ||
      (entry.key.scType !== 'symbol' && entry.key.scType !== 'string') ||
      typeof entry.key.value !== 'string' ||
      names.has(entry.key.value)
    ) {
      return undefined
    }
    names.add(entry.key.value)
  }
  return names
}

function structFieldNames(struct: ContractSpecStruct): Set<string> | undefined {
  const names = new Set<string>()
  for (const field of struct.fields) {
    const name = field.name().toString()
    if (names.has(name)) return undefined
    names.add(name)
  }
  return names
}

function sameNames(left: Set<string>, right: Set<string>): boolean {
  return left.size === right.size && [...left].every((name) => right.has(name))
}

/** Keep structs whose field names exactly match every decoded map in a vector. */
export function findCompatibleStructs(
  collection: Node,
  structs: Array<ContractSpecStruct>,
): Array<ContractSpecStruct> {
  if (
    collection.kind !== 'vec' ||
    collection.items.length === 0 ||
    (collection.omittedChildren ?? 0) > 0
  ) {
    return []
  }

  const itemShapes: Array<Set<string>> = []
  for (const item of collection.items) {
    if (item.kind !== 'map') return []
    const names = getMapFieldNames(item)
    if (!names) return []
    itemShapes.push(names)
  }

  return structs.filter((struct) => {
    const names = structFieldNames(struct)
    return (
      names !== undefined &&
      itemShapes.every((shape) => sameNames(shape, names))
    )
  })
}
