import { resolveStructFieldRows } from './resolveStructFieldRows'
import type { ContractSpecStruct } from '../../types/contract-spec'
import type { Node } from '../../types/node'
import type { ContractSchemaField } from '../../store/types'

const simpleTypes: Partial<Record<string, string>> = Object.fromEntries(
  [
    'bool',
    'void',
    'error',
    'u32',
    'i32',
    'u64',
    'i64',
    'timepoint',
    'duration',
    'u128',
    'i128',
    'u256',
    'i256',
    'bytes',
    'string',
    'symbol',
    'address',
    'vec',
    'map',
  ].map((type) => [type, type]),
)
simpleTypes.bytesn = 'bytes'

/** Compare concrete outer ScVal types; UDT and generic payload compatibility is not inferred. */
export function structSchemaFields(
  collection: Node,
  struct: ContractSpecStruct,
  keyPath: string,
): {
  expected: Array<ContractSchemaField>
  actual: Array<ContractSchemaField>
} {
  const rows = resolveStructFieldRows(collection, struct, keyPath) ?? []
  const fields = new Map(
    struct.fields.map((field) => {
      const name = field.name()
      return [
        typeof name === 'string' ? name : new TextDecoder().decode(name),
        field,
      ]
    }),
  )
  const expected: Array<ContractSchemaField> = []
  const actual: Array<ContractSchemaField> = []
  for (const row of rows) {
    const field = fields.get(row.label)
    if (!field) continue
    const type =
      simpleTypes[
        field.type().switch().name.replace('scSpecType', '').toLowerCase()
      ]
    if (!type) continue
    expected.push({ keyPath: row.keyPath, type })
    actual.push({
      keyPath: row.keyPath,
      type: row.node.kind === 'primitive' ? row.node.scType : row.node.kind,
    })
  }
  return { expected, actual }
}
