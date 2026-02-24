import { rpc, xdr } from '@stellar/stellar-sdk'

export interface GetLedgerEntriesParams {
  rpcUrl: string
  keys: Array<string>
  signal?: AbortSignal
}

export interface GetLedgerEntriesResult {
  entries: Array<{
    key: string
    xdr: string
    lastModifiedLedgerSeq?: number
    liveUntilLedgerSeq?: number
  }>
  latestLedger: number
}

export class AbortError extends Error {
  constructor(message = 'Request was aborted') {
    super(message)
    this.name = 'AbortError'
  }
}

export async function getLedgerEntries(
  params: GetLedgerEntriesParams,
): Promise<GetLedgerEntriesResult> {
  const { rpcUrl, keys, signal } = params

  if (signal?.aborted) {
    throw new AbortError()
  }

  const server = new rpc.Server(rpcUrl)

  try {
    const ledgerKeys = keys.map((key) => xdr.LedgerKey.fromXDR(key, 'base64'))
    const response = await server.getLedgerEntries(...ledgerKeys)

    if (signal?.aborted) {
      throw new AbortError()
    }

    return {
      entries: response.entries.map((entry: rpc.Api.LedgerEntryResult) => ({
        key: entry.key.toXDR('base64'),
        xdr: entry.val.toXDR('base64'),
        lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
        liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
      })),
      latestLedger: response.latestLedger,
    }
  } catch (error) {
    if (signal?.aborted) {
      throw new AbortError()
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AbortError(error.message)
    }
    throw error
  }
}
