export interface RpcConfig {
  url: string
  timeout: number
  headers?: Record<string, string>
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
