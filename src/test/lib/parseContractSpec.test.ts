import { xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'
import { parseContractSpec } from '../../lib/spec/parseContractSpec'
import { extractContractspecv0 } from '../../lib/wasm/wasmExtractor'
import {
  createContractSpecWasm,
  createWasmWithoutSpec,
} from '../helpers/contractSpecFixtures'

describe('parseContractSpec', () => {
  it('decodes supported XDR variants into concrete domain types', () => {
    const functionEntry = xdr.ScSpecEntry.scSpecEntryFunctionV0(
      new xdr.ScSpecFunctionV0({
        doc: '',
        name: 'balance',
        inputs: [],
        outputs: [xdr.ScSpecTypeDef.scSpecTypeI128()],
      }),
    )
    const structEntry = xdr.ScSpecEntry.scSpecEntryUdtStructV0(
      new xdr.ScSpecUdtStructV0({
        doc: '',
        lib: '',
        name: 'Account',
        fields: [
          new xdr.ScSpecUdtStructFieldV0({
            doc: '',
            name: 'balance',
            type: xdr.ScSpecTypeDef.scSpecTypeI128(),
          }),
        ],
      }),
    )
    const enumEntry = xdr.ScSpecEntry.scSpecEntryUdtEnumV0(
      new xdr.ScSpecUdtEnumV0({
        doc: '',
        lib: '',
        name: 'Color',
        cases: [
          new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'RED', value: 0 }),
          new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'GREEN', value: 1 }),
        ],
      }),
    )
    const errorEnumEntry = xdr.ScSpecEntry.scSpecEntryUdtErrorEnumV0(
      new xdr.ScSpecUdtErrorEnumV0({
        doc: '',
        lib: '',
        name: 'Failure',
        cases: [
          new xdr.ScSpecUdtErrorEnumCaseV0({
            doc: '',
            name: 'Missing',
            value: 1,
          }),
        ],
      }),
    )
    const unionEntry = xdr.ScSpecEntry.scSpecEntryUdtUnionV0(
      new xdr.ScSpecUdtUnionV0({
        doc: '',
        lib: '',
        name: 'Result',
        cases: [
          xdr.ScSpecUdtUnionCaseV0.scSpecUdtUnionCaseVoidV0(
            new xdr.ScSpecUdtUnionCaseVoidV0({ doc: '', name: 'Empty' }),
          ),
        ],
      }),
    )
    const wasm = createContractSpecWasm([
      functionEntry,
      structEntry,
      enumEntry,
      errorEnumEntry,
      unionEntry,
    ])
    const extracted = extractContractspecv0(wasm)
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const result = parseContractSpec(extracted.payload)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.spec.entries.map((entry) => entry.kind)).toEqual([
      'function',
      'struct',
      'enum',
      'error-enum',
      'union',
    ])
    expect(result.spec.entries[0]).toMatchObject({
      kind: 'function',
      name: 'balance',
    })
    expect(result.spec.entries[1]).toMatchObject({
      kind: 'struct',
      name: 'Account',
    })
    expect(result.spec.entries[3]).toMatchObject({
      kind: 'error-enum',
      name: 'Failure',
    })
    expect(result.spec.entries[4]).toMatchObject({
      kind: 'union',
      name: 'Result',
    })
    expect(result.spec.enumEntries).toEqual([
      {
        name: 'Color',
        cases: [
          { name: 'RED', value: 0 },
          { name: 'GREEN', value: 1 },
        ],
      },
      { name: 'Failure', cases: [{ name: 'Missing', value: 1 }] },
    ])
    expect(result.spec.enumLookup.Color[0]).toBe('RED')
    expect(result.spec.enumLookup.Failure[1]).toBe('Missing')
  })

  it('rejects a payload without spec entries', () => {
    expect(parseContractSpec(new Uint8Array()).ok).toBe(false)
    expect(parseContractSpec(new Uint8Array([0xff, 0xff, 0xff, 0xff])).ok).toBe(
      false,
    )
    const noSpec = extractContractspecv0(createWasmWithoutSpec())
    expect(noSpec.ok).toBe(false)
  })
})
