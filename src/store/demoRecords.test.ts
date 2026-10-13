import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_CONTRACT_ID } from '../lib/demoContract'
import { resetStore, useLensStore } from './lensStore'
import { ConnectionStatus } from './types'
import type { LedgerEntry } from './types'

const LIVE_A = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1'
const LIVE_B = 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2'

function entry(key: string, contractId: string): LedgerEntry {
  return {
    key,
    contractId,
    type: 'ContractData',
    value: { data: key },
    lastModifiedLedger: 100,
  }
}

describe('demo/live boundary (SSL#733)', () => {
  beforeEach(() => {
    resetStore()
  })

  it('purges sample-contract records when opening a live contract', () => {
    const { upsertLedgerEntries, setActiveContractId } = useLensStore.getState()
    upsertLedgerEntries([
      entry('demo::a', SAMPLE_CONTRACT_ID),
      entry('live::a', LIVE_A),
    ])

    setActiveContractId(LIVE_A)

    const { ledgerData, activeContractId } = useLensStore.getState()
    expect(activeContractId).toBe(LIVE_A)
    expect(Object.keys(ledgerData)).toEqual(['live::a'])
  })

  it('preserves unrelated contracts and network state', () => {
    const { upsertLedgerEntries, setActiveContractId, setConnectionStatus } =
      useLensStore.getState()
    upsertLedgerEntries([
      entry('demo::a', SAMPLE_CONTRACT_ID),
      entry('live::a', LIVE_A),
      entry('live::b', LIVE_B),
    ])
    const networkBefore = useLensStore.getState().networkConfig
    setConnectionStatus(ConnectionStatus.SUCCESS)

    setActiveContractId(LIVE_A)

    const state = useLensStore.getState()
    expect(Object.keys(state.ledgerData).sort()).toEqual(['live::a', 'live::b'])
    expect(state.networkConfig).toEqual(networkBefore)
    expect(state.connectionStatus).toBe(ConnectionStatus.SUCCESS)
  })

  it('keeps demo records while the sample contract is open', () => {
    const { upsertLedgerEntries, setActiveContractId } = useLensStore.getState()
    upsertLedgerEntries([entry('demo::a', SAMPLE_CONTRACT_ID)])

    setActiveContractId(SAMPLE_CONTRACT_ID)

    expect(Object.keys(useLensStore.getState().ledgerData)).toEqual(['demo::a'])
  })

  it('clearDemoRecords drops only sample entries on demand', () => {
    const { upsertLedgerEntries, clearDemoRecords } = useLensStore.getState()
    upsertLedgerEntries([
      entry('demo::a', SAMPLE_CONTRACT_ID),
      entry('live::a', LIVE_A),
    ])

    clearDemoRecords()

    expect(Object.keys(useLensStore.getState().ledgerData)).toEqual(['live::a'])
  })

  it('purges lowercase sample entries too (case-insensitive boundary)', () => {
    const { upsertLedgerEntries, setActiveContractId } = useLensStore.getState()
    upsertLedgerEntries([
      entry('demo::a', SAMPLE_CONTRACT_ID.toLowerCase()),
      entry('live::a', LIVE_A),
    ])

    setActiveContractId(LIVE_A)

    expect(Object.keys(useLensStore.getState().ledgerData)).toEqual(['live::a'])
  })

  it('does not purge when opening the sample via a lowercase URL', () => {
    const { upsertLedgerEntries, setActiveContractId } = useLensStore.getState()
    upsertLedgerEntries([entry('demo::a', SAMPLE_CONTRACT_ID)])

    setActiveContractId(SAMPLE_CONTRACT_ID.toLowerCase())

    expect(useLensStore.getState().activeContractId).toBe(
      SAMPLE_CONTRACT_ID.toLowerCase(),
    )
    expect(Object.keys(useLensStore.getState().ledgerData)).toEqual(['demo::a'])
  })
})
