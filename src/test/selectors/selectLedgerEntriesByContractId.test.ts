// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { selectLedgerEntriesByContractId } from '../../lib/selectors/selectLedgerEntriesByContractId'
import type { LedgerEntry, LensStore } from '../../store/types'

function makeEntry(
  overrides: Partial<LedgerEntry> & { key: string; contractId: string },
): LedgerEntry {
  return {
    type: 'ContractData',
    value: null,
    lastModifiedLedger: 100,
    ...overrides,
  }
}

function makeState(entries: Array<LedgerEntry>): LensStore {
  const ledgerData: Record<string, LedgerEntry> = {}
  for (const entry of entries) {
    ledgerData[entry.key] = entry
  }
  return { ledgerData } as unknown as LensStore
}

describe('selectLedgerEntriesByContractId', () => {
  const entryA = makeEntry({ key: 'key-b', contractId: 'CABC' })
  const entryB = makeEntry({ key: 'key-a', contractId: 'CABC' })
  const entryC = makeEntry({ key: 'key-c', contractId: 'CXYZ' })

  const state = makeState([entryA, entryB, entryC])

  it('should return entries matching the given contractId', () => {
    const result = selectLedgerEntriesByContractId(state, 'CABC')
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.contractId === 'CABC')).toBe(true)
  })

  it('should sort results by key in ascending order', () => {
    const result = selectLedgerEntriesByContractId(state, 'CABC')
    expect(result[0].key).toBe('key-a')
    expect(result[1].key).toBe('key-b')
  })

  it('should return a single entry when only one matches', () => {
    const result = selectLedgerEntriesByContractId(state, 'CXYZ')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(entryC)
  })

  it('should return empty array for unknown contractId', () => {
    expect(selectLedgerEntriesByContractId(state, 'CUNKNOWN')).toEqual([])
  })

  it('should return empty array for empty string', () => {
    expect(selectLedgerEntriesByContractId(state, '')).toEqual([])
  })

  it('should return empty array for whitespace-only string', () => {
    expect(selectLedgerEntriesByContractId(state, '   ')).toEqual([])
    expect(selectLedgerEntriesByContractId(state, '\t')).toEqual([])
  })

  it('should return empty array for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntriesByContractId(state, null)).toEqual([])
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntriesByContractId(state, undefined)).toEqual([])
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntriesByContractId(state, 123)).toEqual([])
  })

  it('should return empty array when ledgerData is empty', () => {
    const emptyState = makeState([])
    expect(selectLedgerEntriesByContractId(emptyState, 'CABC')).toEqual([])
  })

  it('should not match partial contractId strings', () => {
    expect(selectLedgerEntriesByContractId(state, 'CAB')).toEqual([])
    expect(selectLedgerEntriesByContractId(state, 'CABCD')).toEqual([])
  })
})
