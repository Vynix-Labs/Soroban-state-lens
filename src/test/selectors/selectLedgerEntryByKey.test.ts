// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { selectLedgerEntryByKey } from '../../lib/selectors/selectLedgerEntryByKey'
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

describe('selectLedgerEntryByKey', () => {
  const entryA = makeEntry({ key: 'contract:ABC123:Balance', contractId: 'ABC123' })
  const entryB = makeEntry({ key: 'contract:DEF456:Supply', contractId: 'DEF456' })
  const entryC = makeEntry({ key: 'account:GXYZ...:balance', contractId: '' })

  const state = makeState([entryA, entryB, entryC])

  it('should return the entry for an existing key', () => {
    const result = selectLedgerEntryByKey(state, 'contract:ABC123:Balance')
    expect(result).toEqual(entryA)
  })

  it('should return the entry for another existing key', () => {
    const result = selectLedgerEntryByKey(state, 'contract:DEF456:Supply')
    expect(result).toEqual(entryB)
  })

  it('should return undefined for a non-existent key', () => {
    const result = selectLedgerEntryByKey(state, 'contract:NONEXISTENT:key')
    expect(result).toBeUndefined()
  })

  it('should return undefined for empty string key', () => {
    const result = selectLedgerEntryByKey(state, '')
    expect(result).toBeUndefined()
  })

  it('should return undefined for whitespace-only key', () => {
    expect(selectLedgerEntryByKey(state, '   ')).toBeUndefined()
    expect(selectLedgerEntryByKey(state, '\t')).toBeUndefined()
    expect(selectLedgerEntryByKey(state, '\n')).toBeUndefined()
  })

  it('should return undefined for non-string types at runtime', () => {
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntryByKey(state, null)).toBeUndefined()
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntryByKey(state, undefined)).toBeUndefined()
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntryByKey(state, 123)).toBeUndefined()
    // @ts-ignore - testing runtime behavior
    expect(selectLedgerEntryByKey(state, {})).toBeUndefined()
  })

  it('should return undefined when ledgerData is empty', () => {
    const emptyState = makeState([])
    expect(selectLedgerEntryByKey(emptyState, 'any:key')).toBeUndefined()
  })

  it('should not mutate the state', () => {
    const originalState = JSON.parse(JSON.stringify(state))
    selectLedgerEntryByKey(state, 'contract:ABC123:Balance')
    expect(state).toEqual(originalState)
  })

  it('should return exact entry without modification', () => {
    const result = selectLedgerEntryByKey(state, 'contract:ABC123:Balance')
    expect(result).toBe(entryA) // Same reference
  })

  it('should handle keys with special characters', () => {
    const specialEntry = makeEntry({ 
      key: 'contract:SPECIAL!@#$%^&*():data', 
      contractId: 'SPECIAL' 
    })
    const stateWithSpecial = makeState([specialEntry])
    
    const result = selectLedgerEntryByKey(stateWithSpecial, 'contract:SPECIAL!@#$%^&*():data')
    expect(result).toEqual(specialEntry)
  })
})
