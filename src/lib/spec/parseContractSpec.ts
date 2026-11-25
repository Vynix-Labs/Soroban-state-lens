import { xdr } from '@stellar/stellar-sdk'
import { buildEnumLookup } from './resolveEnumValue'

import type { ContractSpec, ContractSpecEntry } from '../../types/contract-spec'
import type { EnumLookup, SpecEnumEntry } from './resolveEnumValue'

const MAX_SPEC_ENTRIES = 1024

export type ScSpecEntry = ReturnType<typeof xdr.ScSpecEntry.fromXDR>

export interface ParsedContractSpec extends ContractSpec {
  format: 'contractspecv0'
  enumEntries: Array<SpecEnumEntry>
  enumLookup: EnumLookup
}

export type ParseContractSpecResult =
  | { ok: true; spec: ParsedContractSpec }
  | { ok: false; reason: string }

/** Minimal js-xdr reader backed by Uint8Array, so browser needs no Buffer global. */
class XdrPayloadReader {
  private offset = 0
  private readonly view: DataView

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  get position(): number {
    return this.offset
  }

  private advance(size: number): number {
    if (size < 0 || this.offset + size > this.bytes.length) {
      throw new Error('Truncated contract spec payload')
    }
    const start = this.offset
    this.offset += size
    return start
  }

  read(size: number): Uint8Array {
    const paddedSize = Math.ceil(size / 4) * 4
    const start = this.advance(paddedSize)
    return this.bytes.slice(start, start + size)
  }

  readInt32BE(): number {
    return this.view.getInt32(this.advance(4), false)
  }

  readUInt32BE(): number {
    return this.view.getUint32(this.advance(4), false)
  }

  readBigInt64BE(): bigint {
    return this.view.getBigInt64(this.advance(8), false)
  }

  readBigUInt64BE(): bigint {
    return this.view.getBigUint64(this.advance(8), false)
  }

  readFloatBE(): number {
    return this.view.getFloat32(this.advance(4), false)
  }

  readDoubleBE(): number {
    return this.view.getFloat64(this.advance(8), false)
  }
}

function decodeXdrString(value: string | Uint8Array): string {
  return typeof value === 'string'
    ? value
    : new TextDecoder('utf-8', { fatal: true }).decode(value)
}

function parseEntries(payload: Uint8Array): Array<ScSpecEntry> {
  const reader = new XdrPayloadReader(payload)
  const entries: Array<ScSpecEntry> = []
  while (reader.position < payload.length) {
    if (entries.length >= MAX_SPEC_ENTRIES) {
      throw new Error('Contract spec has too many entries')
    }
    const entry = xdr.ScSpecEntry.read(
      reader as Parameters<typeof xdr.ScSpecEntry.read>[0],
    )
    if (reader.position > payload.length) {
      throw new Error('Truncated contract spec payload')
    }
    entries.push(entry)
  }
  return entries
}

function toContractSpecEntry(entry: ScSpecEntry): ContractSpecEntry {
  switch (entry.switch().name) {
    case 'scSpecEntryFunctionV0': {
      const wire = entry.functionV0()
      return {
        kind: 'function',
        name: decodeXdrString(wire.name()),
        inputs: wire.inputs(),
        outputs: wire.outputs(),
        wire,
      }
    }
    case 'scSpecEntryUdtStructV0': {
      const wire = entry.udtStructV0()
      return {
        kind: 'struct',
        name: decodeXdrString(wire.name()),
        fields: wire.fields(),
        wire,
      }
    }
    case 'scSpecEntryUdtEnumV0': {
      const wire = entry.udtEnumV0()
      return {
        kind: 'enum',
        name: decodeXdrString(wire.name()),
        cases: wire.cases(),
        wire,
      }
    }
    case 'scSpecEntryUdtErrorEnumV0': {
      const wire = entry.udtErrorEnumV0()
      return {
        kind: 'error-enum',
        name: decodeXdrString(wire.name()),
        cases: wire.cases(),
        wire,
      }
    }
    case 'scSpecEntryUdtUnionV0': {
      const wire = entry.udtUnionV0()
      return {
        kind: 'union',
        name: decodeXdrString(wire.name()),
        cases: wire.cases(),
        wire,
      }
    }
    default:
      throw new Error(`Unsupported contract spec entry: ${entry.switch().name}`)
  }
}

function collectEnumEntries(
  entries: Array<ContractSpecEntry>,
): Array<SpecEnumEntry> {
  return entries.flatMap((entry) => {
    if (entry.kind !== 'enum' && entry.kind !== 'error-enum') return []
    return [
      {
        name: entry.name,
        cases: entry.cases.map((item) => ({
          name: decodeXdrString(item.name()),
          value: item.value(),
        })),
      },
    ]
  })
}

/** Decode the contractspecv0 XDR stream into concrete Stellar wire types. */
export function parseContractSpec(
  payload: Uint8Array,
): ParseContractSpecResult {
  if (!(payload instanceof Uint8Array) || payload.length === 0) {
    return { ok: false, reason: 'Contract spec payload is empty' }
  }

  try {
    const entries = parseEntries(payload).map(toContractSpecEntry)
    if (entries.length === 0) {
      return { ok: false, reason: 'Contract spec payload is empty' }
    }
    const enumEntries = collectEnumEntries(entries)
    return {
      ok: true,
      spec: {
        format: 'contractspecv0',
        entries,
        enumEntries,
        enumLookup: buildEnumLookup(enumEntries),
      },
    }
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Failed to decode contract spec',
    }
  }
}
