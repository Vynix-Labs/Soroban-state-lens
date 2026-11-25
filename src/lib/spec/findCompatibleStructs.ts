import { resolveStructFieldRows } from './resolveStructFieldRows'
import type { ContractSpecStruct } from '../../types/contract-spec'
import type { Node } from '../../types/node'

/** Match named map items or an explicit positional view of scalar vector leaves. */
export function findCompatibleStructs(
  collection: Node,
  structs: Array<ContractSpecStruct>,
): Array<ContractSpecStruct> {
  return structs.filter(
    (struct) => resolveStructFieldRows(collection, struct, '') !== undefined,
  )
}
