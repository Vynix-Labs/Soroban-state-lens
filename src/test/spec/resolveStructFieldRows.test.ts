import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { resolveStructFieldRows } from '../../lib/spec/resolveStructFieldRows'
import { findCompatibleStructs } from '../../lib/spec/findCompatibleStructs'
import { createDemoLedgerEntries } from '../../lib/demo/demoLedgerEntries'
import type { ContractSpecStruct } from '../../types/contract-spec'
import type { Node, VecNode } from '../../types/node'

function demoStruct(): ContractSpecStruct {
  const wire = new xdr.ScSpecUdtStructV0({
    doc: '',
    lib: '',
    name: 'DemoVector',
    fields: ['first_value', 'second_value'].map(
      (name) =>
        new xdr.ScSpecUdtStructFieldV0({
          doc: '',
          name,
          type: xdr.ScSpecTypeDef.scSpecTypeU32(),
        }),
    ),
  })
  return { kind: 'struct', name: 'DemoVector', fields: wire.fields(), wire }
}

describe('explicit struct field rows', () => {
  it('labels known demo values while preserving nested raw paths and nodes', () => {
    const entry = createDemoLedgerEntries().find(
      (item) => (item.value as Node).kind === 'vec',
    )!
    const node = entry.value as VecNode
    const before = JSON.stringify(node)
    const rows = resolveStructFieldRows(node, demoStruct(), entry.key)!
    expect(rows.map((row) => row.label)).toEqual([
      'first_value',
      'second_value',
    ])
    expect(rows.map((row) => row.keyPath)).toEqual([
      `${entry.key}.item-0`,
      `${entry.key}.item-1.item-0`,
    ])
    expect(
      rows.map((row) => row.node.kind === 'primitive' && row.node.value),
    ).toEqual([7, 9])
    expect(JSON.stringify(node)).toBe(before)
    expect(findCompatibleStructs(node, [demoStruct()])).toHaveLength(1)
  })
  it('rejects partial or incompatible collections', () => {
    const primitive: Node = {
      kind: 'primitive',
      path: [],
      scType: 'u32',
      value: 7,
      raw: { switch: 'ScvU32' },
    }
    expect(
      resolveStructFieldRows(
        {
          kind: 'vec',
          path: [],
          raw: { switch: 'ScvVec' },
          items: [primitive],
        },
        demoStruct(),
        'root',
      ),
    ).toBeUndefined()
    expect(
      resolveStructFieldRows(
        {
          kind: 'vec',
          path: [],
          raw: { switch: 'ScvVec' },
          items: [primitive, primitive],
          omittedChildren: 1,
        },
        demoStruct(),
        'root',
      ),
    ).toBeUndefined()
  })
})
