import { beforeEach, describe, expect, it, vi } from 'vitest'
import { xdr } from '@stellar/stellar-sdk'
import { ContractLoadStatus } from '../../store/types'

import type { GetLedgerEntriesResult } from '../../lib/network/getLedgerEntries'

function makeTemporaryLedgerKey(): string {
  const ledgerKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32)),
      key: xdr.ScVal.scvSymbol('temporary-key'),
      durability: xdr.ContractDataDurability.temporary(),
    }),
  )
  return ledgerKey.toXDR('base64')
}

const mockGetLedgerEntries = vi.fn()
const mockDecodeScVal = vi.fn()
const mockTerminateDecoderWorkerSafe = vi.fn()
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
  terminateDecoderWorkerSafe: mockTerminateDecoderWorkerSafe,
}))

describe('loadContract action', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetLedgerEntries.mockReset()
    mockDecodeScVal.mockReset()
    mockCreateDecoderWorkerSafe.mockClear()
    mockTerminateDecoderWorkerSafe.mockReset()
  })

  it('loads, decodes, and stores entries on success', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()
    const temporaryKey = makeTemporaryLedgerKey()

    mockGetLedgerEntries.mockResolvedValue({
      entries: [
        {
          key: temporaryKey,
          xdr: 'xdr-1',
          lastModifiedLedgerSeq: 7,
          liveUntilLedgerSeq: 50,
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
    const loadedEntry = state.ledgerData[`C1::Other::${temporaryKey}`]
    expect(state.activeContractId).toBe('C1')
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(Object.keys(state.ledgerData)).toHaveLength(1)
    expect(loadedEntry.rawXdr).toBe('xdr-1')
    expect(loadedEntry.durability).toBe('Temporary')
    expect(loadedEntry.expired).toBe(true)
    expect(loadedEntry.value).toMatchObject({
      value: 'decoded',
    })
  })

  it('sets EMPTY when the load succeeds with no entries', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
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

  it('replaces refreshed contract entries while preserving other contracts', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    mockGetLedgerEntries
      .mockResolvedValueOnce({
        entries: [{ key: 'old-key', xdr: 'old-xdr' }],
        latestLedger: 1,
      })
      .mockResolvedValueOnce({
        entries: [{ key: 'other-key', xdr: 'other-xdr' }],
        latestLedger: 2,
      })
      .mockResolvedValueOnce({
        entries: [{ key: 'new-key', xdr: 'new-xdr' }],
        latestLedger: 3,
      })
    mockDecodeScVal.mockResolvedValue({
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'decoded',
      raw: { switch: 'ScvString', value: 'decoded' },
    })

    await useLensStore.getState().loadContract('C1', ['old-key'])
    await useLensStore.getState().loadContract('C2', ['other-key'])
    await useLensStore.getState().loadContract('C1', ['new-key'])

    const ledgerData = getStoreState().ledgerData
    expect(ledgerData['C1::Other::old-key']).toBeUndefined()
    expect(ledgerData['C1::Other::new-key'].rawXdr).toBe('new-xdr')
    expect(ledgerData['C2::Other::other-key'].rawXdr).toBe('other-xdr')
  })

  it('sets ERROR when load fails', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    mockGetLedgerEntries.mockRejectedValue(new Error('network failure'))

    await useLensStore.getState().loadContract('C_FAIL', ['rpc-key-fail'])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.ERROR)
    expect(state.contractLoadError).toBe('network failure')
    expect(state.contractLoadErrorCode).toBeNull()
    expect(state.contractLoadAttemptCount).toBeNull()
  })

  it('preserves an RPC error code in contract load state', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    const error = Object.assign(new Error('RPC request failed'), {
      code: -32000,
    })
    mockGetLedgerEntries.mockRejectedValue(error)

    await useLensStore.getState().loadContract('C_RPC_FAIL', ['rpc-key'])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.ERROR)
    expect(state.contractLoadError).toBe('RPC request failed')
    expect(state.contractLoadErrorCode).toBe(-32000)
  })

  it.each([1, 3])(
    'stores the %i request attempt count on failure',
    async (attempts) => {
      const { resetStore, getStoreState, useLensStore } =
        await import('../../store/lensStore')
      resetStore()

      mockGetLedgerEntries.mockRejectedValue(
        Object.assign(new Error('network failure'), { attempts }),
      )

      await useLensStore.getState().loadContract('C_FAIL', ['rpc-key-fail'])

      const state = getStoreState()
      expect(state.contractLoadError).toBe('network failure')
      expect(state.contractLoadAttemptCount).toBe(attempts)
    },
  )

  it('keeps malformed XDR visible as a stable raw marker while decoding siblings', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    mockGetLedgerEntries.mockResolvedValue({
      entries: [
        { key: 'good-key', xdr: 'good-xdr', lastModifiedLedgerSeq: 5 },
        { key: 'bad-key', xdr: 'bad-xdr', lastModifiedLedgerSeq: 6 },
      ],
      latestLedger: 6,
    })

    mockDecodeScVal
      .mockResolvedValueOnce({
        kind: 'primitive',
        path: [],
        scType: 'string',
        value: 'decoded',
        raw: { switch: 'ScvString', value: 'decoded' },
      })
      .mockResolvedValueOnce({
        code: 'DECODE_FAILED',
        message: 'Failed to decode ScVal XDR: malformed',
      })

    await useLensStore.getState().loadContract('C_RAW', ['rpc-good', 'rpc-bad'])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(state.ledgerData['C_RAW::Other::good-key'].value).toEqual({
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'decoded',
      raw: { switch: 'ScvString', value: 'decoded' },
    })
    expect(state.ledgerData['C_RAW::Other::bad-key'].value).toEqual({
      kind: 'raw-xdr',
      xdr: 'bad-xdr',
    })
    expect(state.ledgerData['C_RAW::Other::bad-key'].decodeErrorReason).toBe(
      'Failed to decode ScVal XDR: malformed',
    )
  })

  it('ignores stale in-flight results and keeps newest response', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    let resolveFirst:
      | ((value: {
          entries: Array<{
            key: string
            xdr: string
            lastModifiedLedgerSeq?: number
          }>
          latestLedger: number
        }) => void)
      | undefined
    const firstPromise = new Promise<{
      entries: Array<{
        key: string
        xdr: string
        lastModifiedLedgerSeq?: number
      }>
      latestLedger: number
    }>((resolve) => {
      resolveFirst = resolve
    })

    mockGetLedgerEntries
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({
        entries: [{ key: 'new-key', xdr: 'new-xdr', lastModifiedLedgerSeq: 2 }],
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
    expect(state.ledgerData['C_STALE::Other::new-key'].rawXdr).toBe('new-xdr')
    expect(state.ledgerData['C_STALE::Other::old-key']).toBeUndefined()
  })

  it('coalesces refreshes that arrive during a decode batch', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    let resolveFirstDecode: ((value: unknown) => void) | undefined
    const firstDecode = new Promise<unknown>((resolve) => {
      resolveFirstDecode = resolve
    })
    const firstWorker = { decodeScVal: vi.fn().mockReturnValue(firstDecode) }
    const latestWorker = {
      decodeScVal: vi.fn().mockResolvedValue({
        kind: 'primitive',
        path: [],
        scType: 'string',
        value: 'latest',
        raw: { switch: 'ScvString', value: 'new' },
      }),
    }

    mockCreateDecoderWorkerSafe
      .mockImplementationOnce(() => Promise.resolve(firstWorker))
      .mockImplementationOnce(() => Promise.resolve(latestWorker))
    mockGetLedgerEntries
      .mockResolvedValueOnce({
        entries: [{ key: 'old-key', xdr: 'old-xdr', lastModifiedLedgerSeq: 1 }],
        latestLedger: 1,
      })
      .mockResolvedValueOnce({
        entries: [
          { key: 'middle-key', xdr: 'middle-xdr', lastModifiedLedgerSeq: 2 },
        ],
        latestLedger: 2,
      })
      .mockResolvedValueOnce({
        entries: [
          { key: 'latest-key', xdr: 'latest-xdr', lastModifiedLedgerSeq: 3 },
        ],
        latestLedger: 3,
      })

    const firstCall = useLensStore
      .getState()
      .loadContract('C_DECODE_STALE', ['old'])
    for (
      let attempt = 0;
      attempt < 10 && !firstWorker.decodeScVal.mock.calls.length;
      attempt += 1
    ) {
      await Promise.resolve()
    }

    const middleCall = useLensStore
      .getState()
      .loadContract('C_DECODE_STALE', ['middle'])
    const latestCall = useLensStore
      .getState()
      .loadContract('C_DECODE_STALE', ['latest'])
    for (
      let attempt = 0;
      attempt < 10 && mockGetLedgerEntries.mock.calls.length < 3;
      attempt += 1
    ) {
      await Promise.resolve()
    }

    expect(mockCreateDecoderWorkerSafe).toHaveBeenCalledTimes(1)
    expect(latestWorker.decodeScVal).not.toHaveBeenCalled()

    resolveFirstDecode?.({
      kind: 'primitive',
      path: [],
      scType: 'string',
      value: 'old',
      raw: { switch: 'ScvString', value: 'old' },
    })
    await Promise.all([firstCall, middleCall, latestCall])

    const state = getStoreState()
    expect(state.contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(latestWorker.decodeScVal).toHaveBeenCalledWith({ xdr: 'latest-xdr' })
    expect(latestWorker.decodeScVal).toHaveBeenCalledTimes(1)
    expect(state.ledgerData['C_DECODE_STALE::Other::latest-key'].rawXdr).toBe(
      'latest-xdr',
    )
    expect(state.ledgerData['C_DECODE_STALE::Other::old-key']).toBeUndefined()
    expect(
      state.ledgerData['C_DECODE_STALE::Other::middle-key'],
    ).toBeUndefined()
  })

  describe('refreshActiveKeys action', () => {
    it('does nothing when there is no active contract', async () => {
      const { resetStore, useLensStore } = await import('../../store/lensStore')
      resetStore()

      await useLensStore.getState().refreshActiveKeys()
      expect(mockGetLedgerEntries).not.toHaveBeenCalled()
    })

    it('does nothing when there are no keys for the active contract', async () => {
      const { resetStore, useLensStore } = await import('../../store/lensStore')
      resetStore()

      useLensStore.setState({ activeContractId: 'C1', ledgerData: {} })

      await useLensStore.getState().refreshActiveKeys()
      expect(mockGetLedgerEntries).not.toHaveBeenCalled()
    })

    it('avoids duplicate in-flight work when a load is already active', async () => {
      const { resetStore, useLensStore } = await import('../../store/lensStore')
      resetStore()

      useLensStore.setState({
        activeContractId: 'C1',
        ledgerData: {
          'C1::Other::rpc-key-1': {
            key: 'C1::Other::rpc-key-1',
            contractId: 'C1',
            type: 'Other',
            value: null,
            lastModifiedLedger: 1,
            rawXdr: 'xdr',
          },
        },
      })

      let resolveFirst: ((value: GetLedgerEntriesResult) => void) | undefined
      mockGetLedgerEntries.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
      )

      const loadPromise = useLensStore.getState().loadContract('C1', ['rpc-key-1'])
      await useLensStore.getState().refreshActiveKeys()

      expect(mockGetLedgerEntries).toHaveBeenCalledTimes(1)

      if (resolveFirst) {
        resolveFirst({ entries: [], latestLedger: 2 })
      }
      await loadPromise
    })

    it('emits sequence changes and counts fetches correctly on refresh', async () => {
      const { resetStore, getStoreState, useLensStore } = await import(
        '../../store/lensStore'
      )
      resetStore()

      useLensStore.setState({
        activeContractId: 'C_REFRESH',
        currentLedgerSequence: 100,
        ledgerData: {
          'C_REFRESH::Other::rpc-key-1': {
            key: 'C_REFRESH::Other::rpc-key-1',
            contractId: 'C_REFRESH',
            type: 'Other',
            value: null,
            lastModifiedLedger: 90,
            rawXdr: 'xdr-1',
          },
          'C_REFRESH::Other::rpc-key-2': {
            key: 'C_REFRESH::Other::rpc-key-2',
            contractId: 'C_REFRESH',
            type: 'Other',
            value: null,
            lastModifiedLedger: 95,
            rawXdr: 'xdr-2',
          },
        },
      })

      mockGetLedgerEntries.mockResolvedValueOnce({
        entries: [
          { key: 'rpc-key-1', xdr: 'xdr-1-new', lastModifiedLedgerSeq: 101 },
          { key: 'rpc-key-2', xdr: 'xdr-2-new', lastModifiedLedgerSeq: 101 },
        ],
        latestLedger: 105,
      })

      mockDecodeScVal.mockResolvedValue({
        kind: 'primitive',
        path: [],
        scType: 'string',
        value: 'decoded-new',
        raw: { switch: 'ScvString', value: 'decoded-new' },
      })

      await useLensStore.getState().refreshActiveKeys()

      expect(mockGetLedgerEntries).toHaveBeenCalledTimes(1)
      expect(mockGetLedgerEntries).toHaveBeenCalledWith(
        expect.objectContaining({ keys: ['rpc-key-1', 'rpc-key-2'] }),
      )

      const state = getStoreState()
      expect(state.currentLedgerSequence).toBe(105)
      expect(state.ledgerData['C_REFRESH::Other::rpc-key-1'].rawXdr).toBe(
        'xdr-1-new',
      )
      expect(state.ledgerData['C_REFRESH::Other::rpc-key-2'].rawXdr).toBe(
        'xdr-2-new',
      )
    })
  })

  it('restarts a failed decoder worker and keeps later entries decodable', async () => {
    const { resetStore, getStoreState, useLensStore } =
      await import('../../store/lensStore')
    resetStore()

    const failedWorker = {
      decodeScVal: vi
        .fn()
        .mockRejectedValue(new Error('Decoder worker stopped')),
    }
    const recoveredWorker = {
      decodeScVal: vi.fn().mockResolvedValue({
        kind: 'primitive',
        path: [],
        scType: 'string',
        value: 'recovered',
        raw: { switch: 'ScvString', value: 'recovered' },
      }),
    }
    mockCreateDecoderWorkerSafe
      .mockImplementationOnce(() => Promise.resolve(failedWorker))
      .mockImplementationOnce(() => Promise.resolve(recoveredWorker))
    mockGetLedgerEntries.mockResolvedValue({
      entries: [
        { key: 'first-key', xdr: 'first-xdr' },
        { key: 'second-key', xdr: 'second-xdr' },
      ],
      latestLedger: 2,
    })

    await useLensStore
      .getState()
      .loadContract('C_RECOVER', ['first-key', 'second-key'])

    const { ledgerData, contractLoadStatus } = getStoreState()
    expect(contractLoadStatus).toBe(ContractLoadStatus.SUCCESS)
    expect(ledgerData['C_RECOVER::Other::first-key']).toMatchObject({
      value: { kind: 'raw-xdr', xdr: 'first-xdr' },
      decodeErrorReason: 'Decoder worker stopped',
    })
    expect(ledgerData['C_RECOVER::Other::second-key'].value).toMatchObject({
      value: 'recovered',
    })
    expect(mockCreateDecoderWorkerSafe).toHaveBeenCalledTimes(2)
    expect(mockTerminateDecoderWorkerSafe).toHaveBeenCalledWith(failedWorker)
    expect(mockTerminateDecoderWorkerSafe).toHaveBeenCalledWith(recoveredWorker)
  })
})
