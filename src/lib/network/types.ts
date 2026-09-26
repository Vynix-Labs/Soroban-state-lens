export interface RpcConfig {
  url: string
  timeout: number
  headers?: Record<string, string>
  /** Maximum accepted successful response body size in bytes. */
  maxResponseBytes?: number
  /**
   * Optional caller-provided signal. When aborted, the in-flight request is
   * cancelled and callRpc resolves with a stable `ABORTED` error shape.
   */
  signal?: AbortSignal
}

export interface RpcError {
  message: string
  code?: string | number
  details?: unknown
  isTimeout?: boolean
}

export interface LatestLedgerResult {
  id?: string
  protocolVersion?: number
  sequence: number
}
