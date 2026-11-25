import { Address, xdr } from '@stellar/stellar-sdk'

import type { ScSpecEntry } from '../../lib/spec/parseContractSpec'

export const TEST_CONTRACT_ID = Address.contract(
  new Uint8Array(32).fill(1),
).toString()
export const OTHER_CONTRACT_ID = Address.contract(
  new Uint8Array(32).fill(2),
).toString()

function encodeLeb128(value: number): Uint8Array {
  const bytes: Array<number> = []
  let remaining = value
  do {
    const byte = remaining & 0x7f
    remaining >>= 7
    bytes.push(byte | (remaining === 0 ? 0 : 0x80))
  } while (remaining > 0)
  return new Uint8Array(bytes)
}

function encodeLeb128String(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value)
  const length = encodeLeb128(encoded.length)
  const result = new Uint8Array(length.length + encoded.length)
  result.set(length)
  result.set(encoded, length.length)
  return result
}

function addCustomSection(
  module: Uint8Array,
  name: string,
  payload: Uint8Array,
): Uint8Array {
  const nameBytes = encodeLeb128String(name)
  const sectionPayload = new Uint8Array(nameBytes.length + payload.length)
  sectionPayload.set(nameBytes)
  sectionPayload.set(payload, nameBytes.length)

  const sizeBytes = encodeLeb128(sectionPayload.length)
  const section = new Uint8Array(1 + sizeBytes.length + sectionPayload.length)
  section[0] = 0
  section.set(sizeBytes, 1)
  section.set(sectionPayload, 1 + sizeBytes.length)

  const result = new Uint8Array(module.length + section.length)
  result.set(module)
  result.set(section, module.length)
  return result
}

/**
 * Minimal valid WASM module whose contractspecv0 section holds the raw XDR
 * entry stream used by Soroban (entries are concatenated, no length prefix).
 */
export function createContractSpecWasm(
  entries: Array<ScSpecEntry> = [createEnumSpecEntry()],
): Uint8Array {
  const module = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  ])
  const payloadBytes = entries.flatMap((entry) =>
    Array.from(entry.toXDR('raw') as Uint8Array),
  )
  return addCustomSection(
    module,
    'contractspecv0',
    new Uint8Array(payloadBytes),
  )
}

export function createWasmWithoutSpec(): Uint8Array {
  return new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
}

export function createEnumSpecEntry(): ScSpecEntry {
  const red = new xdr.ScSpecUdtEnumCaseV0({ doc: '', name: 'RED', value: 0 })
  const green = new xdr.ScSpecUdtEnumCaseV0({
    doc: '',
    name: 'GREEN',
    value: 1,
  })
  return xdr.ScSpecEntry.scSpecEntryUdtEnumV0(
    new xdr.ScSpecUdtEnumV0({
      doc: '',
      lib: '',
      name: 'Color',
      cases: [red, green],
    }),
  )
}
