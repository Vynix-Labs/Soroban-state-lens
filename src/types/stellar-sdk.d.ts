declare module '@stellar/stellar-sdk' {
  // Minimal surface needed by the app without pulling in full SDK types.
  export const xdr: any

  export namespace rpc {
    export class Server {
      constructor(url: string)
      getLedgerEntries(
        ...keys: Array<any>
      ): Promise<Api.GetLedgerEntriesResponse>
    }

    export namespace Api {
      export interface LedgerEntryResult {
        key: any
        val: any
        lastModifiedLedgerSeq?: number
        liveUntilLedgerSeq?: number
      }

      export interface GetLedgerEntriesResponse {
        entries: Array<LedgerEntryResult>
        latestLedger: number
      }
    }
  }

  export class Address {
    static account(buffer: any): Address
    static contract(buffer: any): Address
    static fromScVal(scv: any): Address
    toScVal(): any
    toString(): string
  }
}
