declare module '@stellar/stellar-sdk' {
  // Minimal surface needed by the app without pulling in full SDK types.
  export const xdr: any

  export class Address {
    static account(buffer: any): Address
    static contract(buffer: any): Address
    static fromScVal(scv: any): Address
    toScVal(): any
    toString(): string
  }
}

