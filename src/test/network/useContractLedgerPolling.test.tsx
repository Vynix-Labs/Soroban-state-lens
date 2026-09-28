import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as ledgerPoller from '../../lib/network/ledgerPoller'
import { useContractLedgerPolling } from '../../lib/network/useContractLedgerPolling'

describe('useContractLedgerPolling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reloads keys on ledger advances and cleans up across contract/network changes', () => {
    const stop = vi.fn()
    const start = vi
      .spyOn(ledgerPoller, 'startLedgerHeadPoll')
      .mockReturnValue(stop)
    const loadContract = vi.fn().mockResolvedValue(undefined)
    const keys = ['encoded-key']
    const initialProps = {
      contractId: 'C123',
      keys,
      rpcUrl: 'https://rpc-one.example',
      loadContract,
    }

    const { rerender, unmount } = renderHook(
      (props) => useContractLedgerPolling(props),
      { initialProps },
    )

    expect(start).toHaveBeenCalledWith({
      rpcConfig: { url: initialProps.rpcUrl, timeout: 10000 },
      onLedgerChange: expect.any(Function),
    })

    const onLedgerChange = start.mock.calls[0][0].onLedgerChange
    act(() => onLedgerChange(100))
    expect(loadContract).not.toHaveBeenCalled()
    act(() => onLedgerChange(101))
    expect(loadContract).toHaveBeenCalledWith('C123', keys)

    rerender({ ...initialProps, contractId: 'C456' })
    expect(stop).toHaveBeenCalledTimes(1)
    expect(start).toHaveBeenCalledTimes(2)

    rerender({ ...initialProps, rpcUrl: 'https://rpc-two.example' })
    expect(stop).toHaveBeenCalledTimes(2)
    expect(start).toHaveBeenCalledTimes(3)

    unmount()
    expect(stop).toHaveBeenCalledTimes(3)
  })
})
