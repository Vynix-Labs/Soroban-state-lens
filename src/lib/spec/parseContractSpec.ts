import { xdr } from '@stellar/stellar-sdk'
import { buildEnumLookup } from './resolveEnumValue'

import type { EnumLookup, SpecEnumEntry } from './resolveEnumValue'

/** Concrete spec entry type from the Stellar SDK wire definitions. */
export type ScSpecEntry = ReturnType<typeof xdr.ScSpecEntry.fromXDR>

/** Bounds the work done for a single RPC-provided spec payload. */
const MAX_SPEC_ENTRIES = 1024

/** A validated entry from the `contractspecv0` custom section. */
export interface ParsedContractSpecEntry {
  kind: string
  name: string
  /** The concrete wire type produced by the Stellar SDK XDR decoder. */
  entry: ScSpecEntry
}

/**
 * An explicit interpretation of WASM metadata. Only XDR-decoded entries are
 * stored; raw storage bytes are never treated as a struct or enum.
 */
export interface ParsedContractSpec {
  format: 'contractspecv0'
  entries: Array<ParsedContractSpecEntry>
  enumEntries: Array<SpecEnumEntry>
  enumLookup: EnumLookup
}

export type ParseContractSpecResult =
  { ok: true; spec: ParsedContractSpec } | { ok: false; reason: string }

/**
 * Minimal reader for the `read*` methods used by js-xdr. Reading opaque data
 * advances to the next four-byte boundary, as required by XDR. Every read is
 * bounds checked so external WASM data cannot read outside the payload.
 */
class XdrPayloadReader {
  private offset = 0
  private readonly view: DataView

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  get position(): number {
    return this.offset
  }

  private require(size: number): void {
    if (size < 0 || this.offset + size > this.bytes.length) {
      throw new Error('Truncated contract spec payload')
    }
  }

  private advance(size: number): number {
    this.require(size)
    const start = this.offset
    this.offset += size
    return start
  }

  read(size: number): Uint8Array {
    const padded = Math.ceil(size / 4) * 4
    const start = this.advance(padded)
    return this.bytes.slice(start, start + size)
  }

  readInt32BE(): number {
    const start = this.advance(4)
    return this.view.getInt32(start, false)
  }

  readUInt32BE(): number {
    const start = this.advance(4)
    return this.view.getUint32(start, false)
  }

  readBigInt64BE(): bigint {
    const start = this.advance(8)
    return this.view.getBigInt64(start, false)
  }

  readBigUInt64BE(): bigint {
    const start = this.advance(8)
    return this.view.getBigUint64(start, false)
  }

  readFloatBE(): number {
    const start = this.advance(4)
    return this.view.getFloat32(start, false)
  }

  readDoubleBE(): number {
    const start = this.advance(8)
    return this.view.getFloat64(start, false)
  }
}

/** XDR strings are Buffers in Node and Uint8Arrays in the browser. */
function decodeXdrString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) {
    return new TextDecoder('utf-8', { fatal: true }).decode(value)
  }
  return value === undefined || value === null ? '' : String(value)
}

function toEnumEntries(entries: Array<ScSpecEntry>): Array<SpecEnumEntry> {
  const enumEntries: Array<SpecEnumEntry> = []

  for (const entry of entries) {
    if (
      entry.switch().value !== xdr.ScSpecEntryKind.scSpecEntryUdtEnumV0().value
    ) {
      continue
    }

    const enumEntry = entry.udtEnumV0()
    const name = decodeXdrString(enumEntry.name())
    if (!name) continue

    const rawCases = enumEntry.cases() as Array<{
      name(): unknown
      value(): number
    }>
    const cases = rawCases
      .map((candidate) => ({
        name: decodeXdrString(candidate.name()),
        value: Number(candidate.value()),
      }))
      .filter(
        (candidate: { name: string; value: number }) =>
          candidate.name.length > 0 &&
          Number.isInteger(candidate.value) &&
          candidate.value >= 0,
      )

    if (cases.length > 0) {
      enumEntries.push({ name, cases })
    }
  }

  return enumEntries
}

/**
 * Decodes a `contractspecv0` payload into concrete spec entries and derived
 * metadata. Invalid or truncated payloads return a bounded reason instead of
 * throwing, so the caller can surface a safe error.
 */
export function parseContractSpec(
  payload: Uint8Array,
): ParseContractSpecResult {
  if (!(payload instanceof Uint8Array) || payload.length === 0) {
    return { ok: false, reason: 'Contract spec payload is empty' }
  }

  try {
    const reader = new XdrPayloadReader(payload)
    const entries: Array<ScSpecEntry> = []

    while (reader.position < payload.length) {
      if (entries.length >= MAX_SPEC_ENTRIES) {
        return { ok: false, reason: 'Contract spec has too many entries' }
      }

      // js-xdr accepts a reader with this interface at runtime; its published
      // declaration only names Buffer.
      const entry = xdr.ScSpecEntry.read(
        reader as unknown as Parameters<typeof xdr.ScSpecEntry.read>[0],
      )
      if (reader.position > payload.length) {
        return { ok: false, reason: 'Truncated contract spec payload' }
      }
      entries.push(entry)
    }

    if (entries.length === 0) {
      return { ok: false, reason: 'Contract spec payload is empty' }
    }

    const enumEntries = toEnumEntries(entries)

    return {
      ok: true,
      spec: {
        format: 'contractspecv0',
        entries: entries.map((entry) => ({
          kind: entry.switch().name,
          name: decodeXdrString(entry.value().name()),
          entry,
        })),
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
