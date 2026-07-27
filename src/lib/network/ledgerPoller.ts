import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { withJitter } from '../rpc/withJitter'
import { callRpc } from './rpcClient'
import type { LatestLedgerResult, RpcConfig, RpcError } from './types'

export interface LedgerHeadPollOptions {
  rpcConfig: RpcConfig
  intervalMs?: number
  onLedgerChange: (sequence: number) => void
}

const DEFAULT_INTERVAL_MS = 5000

function isRpcError(value: unknown): value is RpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as RpcError).message === 'string'
  )
}

export function startLedgerHeadPoll(
  options: LedgerHeadPollOptions,
): () => void {
  const {
    rpcConfig,
    intervalMs = DEFAULT_INTERVAL_MS,
    onLedgerChange,
  } = options

  let lastSequence: number | null = null
  const stoppedRef = { current: false }

  const tick = async (): Promise<void> => {
    if (stoppedRef.current) return
    // Skip RPC call while the tab is hidden; lastSequence is preserved so the
    // next visible tick can detect a sequence change correctly.
    if (document.visibilityState === 'hidden') return

    const body = buildJsonRpcRequest('getLatestLedger', {}, toRpcRequestId())
    const response = await callRpc<{ result?: LatestLedgerResult }>(
      rpcConfig,
      body,
    )

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- stop() can run during await
    if (stoppedRef.current) return
    if (isRpcError(response)) return

    const result = response.result
    if (
      result == null ||
      typeof result !== 'object' ||
      typeof result.sequence !== 'number'
    ) {
      return
    }

    const { sequence } = result
    if (lastSequence === null || sequence > lastSequence) {
      lastSequence = sequence
      onLedgerChange(sequence)
    }
  }

  // Resume immediately when the tab becomes visible again so the UI catches up
  // without waiting for the next scheduled poll.
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      void tick()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const scheduleNextPoll = (): void => {
    if (stoppedRef.current) return

    const delayMs = withJitter(intervalMs)
    timeoutId = setTimeout(async () => {
      if (stoppedRef.current) return
      await tick()
      scheduleNextPoll()
    }, delayMs)
  }

  tick()
  scheduleNextPoll()

  return function stop(): void {
    if (stoppedRef.current) return
    stoppedRef.current = true
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
