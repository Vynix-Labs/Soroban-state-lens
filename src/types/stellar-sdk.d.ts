declare module '@stellar/stellar-sdk' {
  // Minimal surface needed by the app without pulling in full SDK types.
  export const xdr: any
  export namespace rpc {
    export class Server {
      constructor(url: string)
      getLedgerEntries(...keys: Array<any>): Promise<any>
    }
    export namespace Api {
      export type LedgerEntryResult = any
    }
  }

  export namespace rpc {
    class Server {
      constructor(serverUrl: string, options?: any)
      getLedgerEntries(
        ...keys: Array<any>
      ): Promise<Api.GetLedgerEntriesResponse>
    }

    namespace Api {
      interface LedgerEntryResult {
        key: any
        val: any
        lastModifiedLedgerSeq?: number
        liveUntilLedgerSeq?: number
      }
    }
  }

  export class Address {
    static account(buffer: any): Address
    static contract(buffer: any): Address
    static fromScVal(scv: any): Address
    static fromScAddress(
      value: import('@stellar/stellar-base').xdr.ScAddress,
    ): Address
    toScVal(): any
    toString(): string
  }

  export class Account {
    constructor(accountId: string, sequence: string)
  }

  export const BASE_FEE: string
  export const Asset: typeof import('@stellar/stellar-base').Asset
  export const Contract: typeof import('@stellar/stellar-base').Contract
  export const FeeBumpTransaction: typeof import('@stellar/stellar-base').FeeBumpTransaction
  export const Networks: typeof import('@stellar/stellar-base').Networks
  export function nativeToScVal(value: unknown): any
  export const Operation: {
    payment: typeof import('@stellar/stellar-base').Operation.payment
    invokeContractFunction: (options: {
      contract: string
      function: string
      args: Array<any>
    }) => any
  }
  export class TransactionBuilder {
    constructor(
      source: Account,
      options: { fee: string; networkPassphrase: string },
    )
    addOperation: (operation: any) => this
    setTimeout: (timeout: number) => this
    build: () => import('@stellar/stellar-base').Transaction
    static fromXDR: typeof import('@stellar/stellar-base').TransactionBuilder.fromXDR
    static buildFeeBumpTransaction: typeof import('@stellar/stellar-base').TransactionBuilder.buildFeeBumpTransaction
  }
  export const StrKey: {
    encodeContract: (publicKey: Uint8Array) => string
    isValidContract: (address: string) => boolean
  }

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
