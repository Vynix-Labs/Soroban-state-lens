declare module '@stellar/stellar-sdk' {
  import type {
    Asset as BaseAsset,
    Contract as BaseContract,
    FeeBumpTransaction as BaseFeeBumpTransaction,
    Networks as BaseNetworks,
    Operation as BaseOperation,
    Transaction as BaseTransaction,
    TransactionBuilder as BaseTransactionBuilder,
    xdr as BaseXdr,
  } from '@stellar/stellar-base'

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
    constructor(address: string)
    toScAddress(): ReturnType<typeof xdr.ScAddress.scAddressTypeContract>
    static account(buffer: any): Address
    static contract(buffer: any): Address
    static fromScVal(scv: any): Address
    static fromScAddress(value: BaseXdr.ScAddress): Address
    toScVal(): any
    toString(): string
  }

  export class Account {
    constructor(accountId: string, sequence: string)
  }

  export const BASE_FEE: string
  export const Asset: typeof BaseAsset
  export const Contract: typeof BaseContract
  export const FeeBumpTransaction: typeof BaseFeeBumpTransaction
  export const Networks: typeof BaseNetworks
  export function nativeToScVal(value: unknown): any
  export const Operation: {
    payment: typeof BaseOperation.payment
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
    build: () => BaseTransaction
    static fromXDR: typeof BaseTransactionBuilder.fromXDR
    static buildFeeBumpTransaction: typeof BaseTransactionBuilder.buildFeeBumpTransaction
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
    constructor(address: string)
    toScAddress(): ReturnType<typeof xdr.ScAddress.scAddressTypeContract>
    static account(buffer: any): Address
    static contract(buffer: any): Address
    static fromScVal(scv: any): Address
    toScVal(): any
    toString(): string
  }
}
