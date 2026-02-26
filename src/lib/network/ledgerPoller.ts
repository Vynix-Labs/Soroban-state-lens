import { buildJsonRpcRequest } from '../rpc/buildJsonRpcRequest'
import { toRpcRequestId } from '../rpc/toRpcRequestId'
import { callRpc } from './rpcClient'
import type { RpcConfig, RpcError } from './types'

export interface GetLatestLedgerResult {
  id?: string
  protocolVersion?: number
  sequence: number
}

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

    const body = buildJsonRpcRequest('getLatestLedger', {}, toRpcRequestId())
    const response = await callRpc<{ result?: GetLatestLedgerResult }>(
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

  const intervalId = setInterval(tick, intervalMs)
  tick()

  return function stop(): void {
    if (stoppedRef.current) return
    stoppedRef.current = true
    clearInterval(intervalId)
  }
}
