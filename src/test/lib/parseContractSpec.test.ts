// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseContractSpec } from '../../lib/spec/parseContractSpec'
import { extractContractspecv0 } from '../../lib/wasm/wasmExtractor'
import {
  createContractSpecWasm,
  createWasmWithoutSpec,
} from '../helpers/contractSpecFixtures'

describe('parseContractSpec', () => {
  it('decodes enum entries into concrete spec metadata', () => {
    const extracted = extractContractspecv0(createContractSpecWasm())
    expect(extracted.ok).toBe(true)
    if (!extracted.ok) return

    const result = parseContractSpec(extracted.payload)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.spec.entries).toHaveLength(1)
    expect(result.spec.enumEntries).toEqual([
      {
        name: 'Color',
        cases: [
          { name: 'RED', value: 0 },
          { name: 'GREEN', value: 1 },
        ],
      },
    ])
    expect(result.spec.enumLookup.Color[0]).toBe('RED')
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
