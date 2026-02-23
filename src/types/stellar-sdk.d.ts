declare module '@stellar/stellar-sdk' {
  // Minimal surface needed by the app without pulling in full SDK types.
  export const xdr: any
  export namespace rpc {
    export class Server {
      constructor(url: string)
      getLedgerEntries(...keys: any[]): Promise<any>
    }
    export namespace Api {
      export type LedgerEntryResult = any
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
