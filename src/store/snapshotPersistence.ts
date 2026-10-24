import type {
  ContractSnapshot,
  LedgerEntry,
  NetworkScopedContractBuckets,
} from './types'

const SNAPSHOT_VALUE_TAG = '__sslSnapshotValue'

interface PersistedSnapshot {
  id: string
  contractId: string
  timestamp: number
  ledgerSequence: number
  entries: Record<string, Omit<LedgerEntry, 'value'> & { value: unknown }>
  label?: string
}

export type PersistedSnapshots = Array<PersistedSnapshot>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function serializeValue(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === undefined) {
    return { [SNAPSHOT_VALUE_TAG]: 'undefined' }
  }
  if (typeof value === 'bigint') {
    return { [SNAPSHOT_VALUE_TAG]: 'bigint', value: value.toString() }
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { [SNAPSHOT_VALUE_TAG]: 'number', value: String(value) }
  }

  if (value === null || typeof value !== 'object') {
    return value
  }

  if (ancestors.has(value)) {
    return { [SNAPSHOT_VALUE_TAG]: 'circular' }
  }

  if (ArrayBuffer.isView(value)) {
    return {
      [SNAPSHOT_VALUE_TAG]: 'bytes',
      value: Array.from(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      ),
    }
  }

  const xdrValue = value as { toXDR?: (format: 'base64') => string }
  if (typeof xdrValue.toXDR === 'function') {
    return {
      [SNAPSHOT_VALUE_TAG]: 'xdr',
      value: xdrValue.toXDR('base64'),
    }
  }

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map((item) => serializeValue(item, ancestors))
    }

    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return {
        [SNAPSHOT_VALUE_TAG]: 'string',
        value: String(value),
      }
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue, ancestors),
      ]),
    )
  } finally {
    ancestors.delete(value)
  }
}

function deserializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeValue)
  }

  if (!isRecord(value)) {
    return value
  }

  const tag = value[SNAPSHOT_VALUE_TAG]
  if (tag === 'undefined') {
    return undefined
  }
  if (
    tag === 'bigint' &&
    typeof value.value === 'string' &&
    /^-?\d+$/.test(value.value)
  ) {
    return BigInt(value.value)
  }
  if (
    tag === 'number' &&
    (value.value === 'NaN' ||
      value.value === 'Infinity' ||
      value.value === '-Infinity')
  ) {
    return Number(value.value)
  }
  if (
    tag === 'bytes' &&
    Array.isArray(value.value) &&
    value.value.every(
      (byte) =>
        typeof byte === 'number' &&
        Number.isInteger(byte) &&
        byte >= 0 &&
        byte <= 255,
    )
  ) {
    return new Uint8Array(value.value)
  }
  if ((tag === 'xdr' || tag === 'string') && typeof value.value === 'string') {
    return { [SNAPSHOT_VALUE_TAG]: tag, value: value.value }
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      deserializeValue(nestedValue),
    ]),
  )
}

function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.key === 'string' &&
    typeof value.contractId === 'string' &&
    (value.type === 'ContractData' ||
      value.type === 'ContractCode' ||
      value.type === 'Account' ||
      value.type === 'Trustline' ||
      value.type === 'Other') &&
    'value' in value &&
    typeof value.lastModifiedLedger === 'number' &&
    Number.isFinite(value.lastModifiedLedger) &&
    Number.isInteger(value.lastModifiedLedger)
  )
}

function deserializeEntry(value: unknown): LedgerEntry | null {
  if (!isLedgerEntry(value)) {
    return null
  }

  return {
    ...value,
    value: deserializeValue(value.value),
  }
}

export function serializeSnapshots(
  snapshots: NetworkScopedContractBuckets<Array<ContractSnapshot>>,
): NetworkScopedContractBuckets<PersistedSnapshots> {
  const serialized: NetworkScopedContractBuckets<PersistedSnapshots> = {}
  for (const [networkId, contracts] of Object.entries(snapshots)) {
    const serializedContracts: Record<string, PersistedSnapshots> = {}
    for (const [contractId, contractSnapshots] of Object.entries(
      contracts ?? {},
    )) {
      if (!contractSnapshots) continue
      serializedContracts[contractId] = contractSnapshots.map((snapshot) => ({
        id: snapshot.id,
        contractId: snapshot.contractId,
        timestamp: snapshot.timestamp,
        ledgerSequence: snapshot.ledgerSequence,
        ...(snapshot.label === undefined ? {} : { label: snapshot.label }),
        entries: Object.fromEntries(
          Object.entries(snapshot.ledgerData).map(([key, entry]) => [
            key,
            {
              ...entry,
              value: serializeValue(entry.value),
            },
          ]),
        ),
      }))
    }
    serialized[networkId] = serializedContracts
  }
  return serialized
}

export interface HydrationDiagnostics {
  discardedEntryCount: number
  discardedEntryCountBySnapshot?: Record<string, number>
}

const MAX_HYDRATION_DIAGNOSTIC_COUNT = 1_000_000

export function hydrateSnapshots(
  value: unknown,
  diagnostics?: HydrationDiagnostics,
): Record<string, Array<ContractSnapshot>> {
  if (!isRecord(value)) {
    return {}
  }

  const snapshots: Record<string, Array<ContractSnapshot>> = {}
  for (const [contractId, contractSnapshots] of Object.entries(value)) {
    if (!Array.isArray(contractSnapshots)) {
      continue
    }

    const validSnapshots: Array<ContractSnapshot> = []
    for (const candidate of contractSnapshots) {
      if (
        !isRecord(candidate) ||
        typeof candidate.id !== 'string' ||
        typeof candidate.contractId !== 'string' ||
        typeof candidate.timestamp !== 'number' ||
        !Number.isFinite(candidate.timestamp) ||
        (candidate.ledgerSequence !== undefined &&
          (typeof candidate.ledgerSequence !== 'number' ||
            !Number.isSafeInteger(candidate.ledgerSequence) ||
            candidate.ledgerSequence < 0))
      ) {
        continue
      }

      const rawEntries = candidate.entries ?? candidate.ledgerData
      if (!isRecord(rawEntries)) {
        continue
      }

      const ledgerData: Record<string, LedgerEntry> = {}
      for (const [key, entry] of Object.entries(rawEntries)) {
        const hydratedEntry = deserializeEntry(entry)
        if (hydratedEntry) {
          ledgerData[key] = hydratedEntry
        } else if (diagnostics) {
          diagnostics.discardedEntryCount = Math.min(
            diagnostics.discardedEntryCount + 1,
            MAX_HYDRATION_DIAGNOSTIC_COUNT,
          )
          if (diagnostics.discardedEntryCountBySnapshot) {
            diagnostics.discardedEntryCountBySnapshot[candidate.id] = Math.min(
              (diagnostics.discardedEntryCountBySnapshot[candidate.id] ?? 0) + 1,
              MAX_HYDRATION_DIAGNOSTIC_COUNT,
            )
          }
        }
      }

      validSnapshots.push({
        id: candidate.id,
        contractId: candidate.contractId,
        timestamp: candidate.timestamp,
        ledgerSequence:
          typeof candidate.ledgerSequence === 'number'
            ? candidate.ledgerSequence
            : 0,
        ledgerData,
        ...(typeof candidate.label === 'string'
          ? { label: candidate.label }
          : {}),
      })
    }

    if (validSnapshots.length > 0) {
      snapshots[contractId] = validSnapshots
    }
  }

  return snapshots
}

export function migrateLegacySnapshotEntries(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.snapshots)) {
    return value
  }

  return {
    ...value,
    snapshots: Object.fromEntries(
      Object.entries(value.snapshots).map(([contractId, snapshots]) => [
        contractId,
        Array.isArray(snapshots)
          ? snapshots.map((snapshot) => {
              if (!isRecord(snapshot) || !('ledgerData' in snapshot)) {
                return snapshot
              }
              const { ledgerData, ...header } = snapshot
              return { ...header, entries: ledgerData }
            })
          : snapshots,
      ]),
    ),
  }
}
