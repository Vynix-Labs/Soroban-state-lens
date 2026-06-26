import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startLedgerHeadPoll } from '../../lib/network/ledgerPoller'
import { callRpc } from '../../lib/network/rpcClient'

vi.mock('../../lib/network/rpcClient', () => ({
  callRpc: vi.fn(),
}))

const mockCallRpc = vi.mocked(callRpc)

/** Helper: override document.visibilityState and fire the visibilitychange event. */
function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('startLedgerHeadPoll', () => {
  const defaultRpcConfig = {
    url: 'https://rpc.example.com',
    timeout: 5000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Ensure each test starts with the tab visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore visible state after each test
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  describe('emits changes only on sequence increment', () => {
    it('calls onLedgerChange when sequence increases', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 100 } })
        .mockResolvedValueOnce({ result: { sequence: 101 } })
        .mockResolvedValueOnce({ result: { sequence: 102 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).toHaveBeenCalledWith(100)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).toHaveBeenCalledWith(101)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).toHaveBeenCalledWith(102)
      expect(onLedgerChange).toHaveBeenCalledTimes(3)
      stop()
      randomSpy.mockRestore()
    })

    it('does not call onLedgerChange when sequence is unchanged', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 100 } })
        .mockResolvedValueOnce({ result: { sequence: 100 } })
        .mockResolvedValueOnce({ result: { sequence: 100 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)
      expect(onLedgerChange).toHaveBeenCalledWith(100)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)
      stop()
      randomSpy.mockRestore()
    })

    it('does not call onLedgerChange when sequence decreases', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 102 } })
        .mockResolvedValueOnce({ result: { sequence: 101 } })
        .mockResolvedValueOnce({ result: { sequence: 100 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).toHaveBeenCalledWith(102)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)
      stop()
      randomSpy.mockRestore()
    })

    it('calls onLedgerChange only for first poll when result has no sequence then valid sequence', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc
        .mockResolvedValueOnce({ result: {} })
        .mockResolvedValueOnce({ result: { sequence: 100 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)
      expect(onLedgerChange).toHaveBeenCalledWith(100)
      stop()
      randomSpy.mockRestore()
    })

    it('does not call onLedgerChange when RPC returns error', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc.mockResolvedValue({
        message: 'Network error',
        code: 'NETWORK_ERROR',
      })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(1000)
      expect(onLedgerChange).not.toHaveBeenCalled()
      stop()
      randomSpy.mockRestore()
    })
  })

  describe('stop function', () => {
    it('halts further polling and callbacks after stop', async () => {
      const onLedgerChange = vi.fn()
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 100 } })
        .mockResolvedValueOnce({ result: { sequence: 101 } })
        .mockResolvedValueOnce({ result: { sequence: 102 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)
      expect(mockCallRpc).toHaveBeenCalledTimes(3)
      expect(onLedgerChange).toHaveBeenCalledTimes(3)

      stop()

      await vi.advanceTimersByTimeAsync(5000)
      expect(mockCallRpc).toHaveBeenCalledTimes(3)
      expect(onLedgerChange).toHaveBeenCalledTimes(3)
      randomSpy.mockRestore()
    })

    it('stop is idempotent', async () => {
      mockCallRpc.mockResolvedValue({ result: { sequence: 100 } })
      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)
      stop()
      stop()
      stop()
      await vi.advanceTimersByTimeAsync(5000)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)
    })
  })

  describe('configurable options', () => {
    it('uses default interval 5000ms when intervalMs omitted', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc.mockResolvedValue({ result: { sequence: 1 } })
      const onLedgerChange = vi.fn()

      startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        onLedgerChange,
      })

      expect(mockCallRpc).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(4999)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mockCallRpc).toHaveBeenCalledTimes(2)
      randomSpy.mockRestore()
    })

    it('uses custom interval when intervalMs provided', async () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      mockCallRpc.mockResolvedValue({ result: { sequence: 1 } })

      startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 2000,
        onLedgerChange: vi.fn(),
      })

      expect(mockCallRpc).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1999)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(mockCallRpc).toHaveBeenCalledTimes(2)
      randomSpy.mockRestore()
    })

    it('jittered interval stays within expected bounds', async () => {
      const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const randomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9)
      mockCallRpc.mockResolvedValue({ result: { sequence: 1 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange: vi.fn(),
      })

      expect(timeoutSpy).toHaveBeenCalledTimes(1)
      const firstDelay = timeoutSpy.mock.calls[0][1] as number
      expect(firstDelay).toBeGreaterThanOrEqual(800)
      expect(firstDelay).toBeLessThanOrEqual(1200)

      await vi.advanceTimersByTimeAsync(firstDelay)
      expect(mockCallRpc).toHaveBeenCalledTimes(2)
      expect(timeoutSpy).toHaveBeenCalledTimes(2)

      const secondDelay = timeoutSpy.mock.calls[1][1] as number
      expect(secondDelay).toBeGreaterThanOrEqual(800)
      expect(secondDelay).toBeLessThanOrEqual(1200)

      await vi.advanceTimersByTimeAsync(secondDelay)
      expect(mockCallRpc).toHaveBeenCalledTimes(3)
      expect(timeoutSpy).toHaveBeenCalledTimes(3)

      const thirdDelay = timeoutSpy.mock.calls[2][1] as number
      expect(thirdDelay).toBeGreaterThanOrEqual(800)
      expect(thirdDelay).toBeLessThanOrEqual(1200)

      stop()
      randomSpy.mockRestore()
      timeoutSpy.mockRestore()
    })

    it('passes rpcConfig to callRpc', async () => {
      const config = {
        url: 'https://custom.rpc.url',
        timeout: 10000,
        headers: { 'X-Custom': 'value' },
      }
      mockCallRpc.mockResolvedValue({ result: { sequence: 1 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: config,
        intervalMs: 10000,
        onLedgerChange: vi.fn(),
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(mockCallRpc).toHaveBeenCalledWith(
        config,
        expect.objectContaining({
          jsonrpc: '2.0',
          method: 'getLatestLedger',
        }),
      )
      stop()
    })
  })

  describe('visibility-aware pausing', () => {
    beforeEach(() => {
      // Deterministic jitter so scheduled poll timing is predictable.
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    it('does not fire an RPC call during interval ticks while the tab is hidden', async () => {
      const onLedgerChange = vi.fn()
      mockCallRpc.mockResolvedValue({ result: { sequence: 100 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      // Initial tick fires (tab is visible)
      await vi.advanceTimersByTimeAsync(0)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)

      // Hide the tab
      setVisibility('hidden')

      // Advance through several interval periods — no additional RPC calls
      await vi.advanceTimersByTimeAsync(3000)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)

      stop()
    })

    it('fires an immediate tick when the tab becomes visible again', async () => {
      const onLedgerChange = vi.fn()
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 100 } }) // initial tick
        .mockResolvedValueOnce({ result: { sequence: 105 } }) // resume tick

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      // Initial tick
      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).toHaveBeenCalledWith(100)

      // Hide, advance time (no ticks), then show again
      setVisibility('hidden')
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockCallRpc).toHaveBeenCalledTimes(1)

      setVisibility('visible')
      await vi.advanceTimersByTimeAsync(0)

      // Resume tick should have fired with the updated sequence
      expect(mockCallRpc).toHaveBeenCalledTimes(2)
      expect(onLedgerChange).toHaveBeenCalledWith(105)
      expect(onLedgerChange).toHaveBeenCalledTimes(2)

      stop()
    })

    it('preserves lastSequence across hidden periods so a stale sequence does not re-notify', async () => {
      const onLedgerChange = vi.fn()
      mockCallRpc
        .mockResolvedValueOnce({ result: { sequence: 100 } }) // initial tick
        .mockResolvedValueOnce({ result: { sequence: 100 } }) // resume tick — same sequence

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(onLedgerChange).toHaveBeenCalledTimes(1)

      setVisibility('hidden')
      await vi.advanceTimersByTimeAsync(2000)

      setVisibility('visible')
      await vi.advanceTimersByTimeAsync(0)

      // Sequence unchanged — callback must NOT fire again
      expect(onLedgerChange).toHaveBeenCalledTimes(1)

      stop()
    })

    it('stop removes the visibilitychange listener so no tick fires after stop', async () => {
      const onLedgerChange = vi.fn()
      mockCallRpc.mockResolvedValue({ result: { sequence: 100 } })

      const stop = startLedgerHeadPoll({
        rpcConfig: defaultRpcConfig,
        intervalMs: 1000,
        onLedgerChange,
      })

      await vi.advanceTimersByTimeAsync(0)
      stop()

      setVisibility('hidden')
      setVisibility('visible')
      await vi.advanceTimersByTimeAsync(0)

      // Only the initial tick should have run
      expect(mockCallRpc).toHaveBeenCalledTimes(1)
    })
  })
})
