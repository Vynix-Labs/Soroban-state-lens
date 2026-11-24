import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEMO_COUNTER_ENTRY_KEY,
  DEMO_COUNTER_INITIAL_VALUE,
  DEMO_COUNTER_NEXT_VALUE,
  readDemoCounterValue,
} from '../../lib/demo/demoLedgerEntries'
import { diffSnapshotEntries } from '../../lib/diff/diffSnapshotEntries'
import { SAMPLE_CONTRACT_ID } from '../../lib/demoContract'
import { resetStore, useLensStore } from '../../store/lensStore'
import { ContractLoadStatus } from '../../store/types'
import type { LedgerEntry } from '../../store/types'

const LIVE_CONTRACT_ID =
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1'

function entriesForContract(contractId: string): Record<string, LedgerEntry> {
  return Object.fromEntries(
    Object.entries(useLensStore.getState().ledgerData).filter(
      ([, entry]) => entry.contractId === contractId,
    ),
  )
}

function counterValue(): number | null {
  return readDemoCounterValue(
    useLensStore.getState().ledgerData[DEMO_COUNTER_ENTRY_KEY],
  )
}

describe('demo counter snapshots (SSL-I050)', () => {
  beforeEach(() => {
    resetStore()
  })

  it('hydrates the 42 counter fixture for the sample contract only', () => {
    const { loadDemoContract } = useLensStore.getState()

    loadDemoContract(LIVE_CONTRACT_ID)
    expect(useLensStore.getState().ledgerData).toEqual({})
    expect(useLensStore.getState().contractLoadStatus).toBe(
      ContractLoadStatus.IDLE,
    )

    loadDemoContract(SAMPLE_CONTRACT_ID)

    const state = useLensStore.getState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(Object.keys(state.ledgerData)).toHaveLength(2)
    expect(state.activeContractId).toBe(SAMPLE_CONTRACT_ID)
    expect(counterValue()).toBe(DEMO_COUNTER_INITIAL_VALUE)
  })

  it('produces exactly one modified entry between the 42 and 43 captures', () => {
    const { loadDemoContract, addSnapshot } = useLensStore.getState()
    loadDemoContract(SAMPLE_CONTRACT_ID)
    const networkBefore = useLensStore.getState().networkConfig
    const before = entriesForContract(SAMPLE_CONTRACT_ID)

    addSnapshot(SAMPLE_CONTRACT_ID, before, 0, 'Before')
    expect(counterValue()).toBe(DEMO_COUNTER_INITIAL_VALUE)

    const advanced = useLensStore
      .getState()
      .advanceDemoCounter(SAMPLE_CONTRACT_ID)
    expect(advanced).toBe(true)
    expect(counterValue()).toBe(DEMO_COUNTER_NEXT_VALUE)

    const after = entriesForContract(SAMPLE_CONTRACT_ID)
    useLensStore.getState().addSnapshot(SAMPLE_CONTRACT_ID, after, 0, 'After')

    const snapshots = useLensStore.getState().getSnapshots(SAMPLE_CONTRACT_ID)
    expect(snapshots).toHaveLength(2)
    const [previous, next] = snapshots
    const diff = diffSnapshotEntries(previous.ledgerData, next.ledgerData)

    const modified = diff.filter((entry) => entry.status === 'modified')
    expect(modified).toHaveLength(1)
    expect(modified[0]?.key).toBe(DEMO_COUNTER_ENTRY_KEY)
    expect(diff.filter((entry) => entry.status === 'unchanged')).toHaveLength(1)
    expect(diff.filter((entry) => entry.status === 'created')).toHaveLength(0)
    expect(diff.filter((entry) => entry.status === 'deleted')).toHaveLength(0)

    const unrelatedKey = Object.keys(before).find(
      (key) => key !== DEMO_COUNTER_ENTRY_KEY,
    )
    expect(unrelatedKey).toBeDefined()
    expect(next.ledgerData[unrelatedKey!]).toEqual(
      previous.ledgerData[unrelatedKey!],
    )
    expect(useLensStore.getState().networkConfig).toEqual(networkBefore)
  })

  it('is unavailable outside the sample demo contract', () => {
    useLensStore.getState().loadDemoContract(SAMPLE_CONTRACT_ID)
    useLensStore.getState().setActiveContractId(LIVE_CONTRACT_ID)
    useLensStore.getState().upsertLedgerEntry({
      key: `${LIVE_CONTRACT_ID}::ContractData::live-key`,
      contractId: LIVE_CONTRACT_ID,
      type: 'ContractData',
      value: 'live value',
      lastModifiedLedger: 7,
    })
    const ledgerBefore = useLensStore.getState().ledgerData

    expect(useLensStore.getState().advanceDemoCounter(LIVE_CONTRACT_ID)).toBe(
      false,
    )
    expect(useLensStore.getState().advanceDemoCounter(SAMPLE_CONTRACT_ID)).toBe(
      false,
    )

    const state = useLensStore.getState()
    expect(state.ledgerData).toEqual(ledgerBefore)
    expect(Object.keys(state.ledgerData)).toEqual([
      `${LIVE_CONTRACT_ID}::ContractData::live-key`,
    ])
  })

  it('does not fabricate a second change once the counter holds 43', () => {
    useLensStore.getState().loadDemoContract(SAMPLE_CONTRACT_ID)
    expect(useLensStore.getState().advanceDemoCounter(SAMPLE_CONTRACT_ID)).toBe(
      true,
    )
    const ledgerAfterFirstAdvance = useLensStore.getState().ledgerData

    expect(useLensStore.getState().advanceDemoCounter(SAMPLE_CONTRACT_ID)).toBe(
      false,
    )
    expect(useLensStore.getState().ledgerData).toEqual(ledgerAfterFirstAdvance)
    expect(counterValue()).toBe(DEMO_COUNTER_NEXT_VALUE)
  })
})
