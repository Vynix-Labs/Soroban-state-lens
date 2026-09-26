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

  it('should not mutate source ledgerData when sorting', () => {
    const unfrozenEntries = [
      makeEntry({ key: 'key-z', contractId: 'CTEST' }),
      makeEntry({ key: 'key-a', contractId: 'CTEST' }),
      makeEntry({ key: 'key-m', contractId: 'CTEST' }),
    ]
    
    const ledgerData: Record<string, LedgerEntry> = {}
    for (const entry of unfrozenEntries) {
      ledgerData[entry.key] = entry
    }
    
    const testState = { ledgerData } as unknown as LensStore
    
    // Get the entries from the selector
    const result = selectLedgerEntriesByContractId(testState, 'CTEST')
    
    // Result should be sorted
    expect(result[0].key).toBe('key-a')
    expect(result[1].key).toBe('key-m')
    expect(result[2].key).toBe('key-z')
    
    // Verify the original ledgerData entries are in their original order
    const originalOrder = Object.values(ledgerData)
    expect(originalOrder[0].key).toBe('key-z')
    expect(originalOrder[1].key).toBe('key-a')
    expect(originalOrder[2].key).toBe('key-m')
  })

  it('should return a copy that can be mutated without affecting selector', () => {
    const result1 = selectLedgerEntriesByContractId(state, 'CABC')
    const result2 = selectLedgerEntriesByContractId(state, 'CABC')
    
    // Results should be logically equal but different array instances
    expect(result1).toEqual(result2)
    expect(result1).not.toBe(result2)
    
    // Mutating one result should not affect the other
    result1.push(makeEntry({ key: 'key-extra', contractId: 'CABC' }))
    expect(result1).toHaveLength(3)
    expect(result2).toHaveLength(2)
  })
})
