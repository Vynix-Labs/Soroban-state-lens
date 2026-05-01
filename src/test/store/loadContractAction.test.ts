import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContractLoadStatus } from '../../store/types'

const mockGetLedgerEntries = vi.fn()
const mockDecodeScVal = vi.fn()
const mockCreateDecoderWorkerSafe = vi.fn(() =>
  Promise.resolve({
    decodeScVal: mockDecodeScVal,
  }),
)

vi.mock('../../lib/network/getLedgerEntries', () => ({
  getLedgerEntries: mockGetLedgerEntries,
}))

vi.mock('../../workers/createDecoderWorkerSafe', () => ({
  createDecoderWorkerSafe: mockCreateDecoderWorkerSafe,
}))

describe('loadContract action', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetLedgerEntries.mockReset()
    mockDecodeScVal.mockReset()
    mockCreateDecoderWorkerSafe.mockClear()
  })

  it('loads, decodes, and stores entries on success', async () => {
    const { resetStore, getStoreState, useLensStore } = await import(
      '../../store/lensStore'
    )
    resetStore()

    mockGetLedgerEntries.mockResolvedValue({
      entries: [
        {
          key: 'key-1',
          xdr: 'xdr-1',
          lastModifiedLedgerSeq: 7,
        },
      ],
      latestLedger: 100,
    })

    mockDecodeScVal.mockResolvedValue({
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'decoded',
      raw: { switch: 'ScvString', value: 'decoded' },
    })

    await useLensStore.getState().loadContract('C1', ['rpc-key-1'])

    const state = getStoreState()
    expect(state.activeContractId).toBe('C1')
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(Object.keys(state.ledgerData)).toHaveLength(1)
    expect(state.ledgerData['C1:Other:key-1'].rawXdr).toBe('xdr-1')
  })

  it('sets EMPTY when the load succeeds with no entries', async () => {
    const { resetStore, getStoreState, useLensStore } = await import(
      '../../store/lensStore'
    )
    resetStore()

    mockGetLedgerEntries.mockResolvedValue({
      entries: [],
      latestLedger: 100,
    })
    mockDecodeScVal.mockResolvedValue({
      kind: 'primitive',
      path: [],
      scType: 'void',
      value: null,
      raw: { switch: 'ScvVoid' },
    })

    await useLensStore.getState().loadContract('C_EMPTY', ['rpc-key-empty'])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.EMPTY)
    expect(state.contractLoadError).toBeNull()
  })

  it('sets ERROR when load fails', async () => {
    const { resetStore, getStoreState, useLensStore } = await import(
      '../../store/lensStore'
    )
    resetStore()

    mockGetLedgerEntries.mockRejectedValue(new Error('network failure'))

    await useLensStore.getState().loadContract('C_FAIL', ['rpc-key-fail'])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.ERROR)
    expect(state.contractLoadError).toBe('network failure')
  })

  it('ignores stale in-flight results and keeps newest response', async () => {
    const { resetStore, getStoreState, useLensStore } = await import(
      '../../store/lensStore'
    )
    resetStore()

    let resolveFirst:
      | ((
          value: {
            entries: Array<{
              key: string
              xdr: string
              lastModifiedLedgerSeq?: number
            }>
            latestLedger: number
          },
        ) => void)
      | undefined
    const firstPromise = new Promise<{
      entries: Array<{ key: string; xdr: string; lastModifiedLedgerSeq?: number }>
      latestLedger: number
    }>((resolve) => {
      resolveFirst = resolve
    })

    mockGetLedgerEntries
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({
        entries: [
          { key: 'new-key', xdr: 'new-xdr', lastModifiedLedgerSeq: 2 },
        ],
        latestLedger: 2,
      })

    mockDecodeScVal.mockResolvedValue({
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'decoded',
      raw: { switch: 'ScvString', value: 'decoded' },
    })

    const firstCall = useLensStore.getState().loadContract('C_STALE', ['k1'])
    const secondCall = useLensStore.getState().loadContract('C_STALE', ['k2'])

    await secondCall

    if (resolveFirst) {
      resolveFirst({
        entries: [{ key: 'old-key', xdr: 'old-xdr', lastModifiedLedgerSeq: 1 }],
        latestLedger: 1,
      })
    }
    await firstCall

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(state.ledgerData['C_STALE:Other:new-key'].rawXdr).toBe('new-xdr')
    expect(state.ledgerData['C_STALE:Other:old-key']).toBeUndefined()
  })
})
