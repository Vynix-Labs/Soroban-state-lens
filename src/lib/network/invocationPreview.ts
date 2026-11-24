/** A contract invocation decoded from a transaction envelope. */
export interface InvocationPreview {
  /** Stellar contract address (C...) of the invoked contract. */
  contractId: string
  /** Function name encoded in the invocation. */
  functionName: string
  /** Ordered arguments, each encoded as base64 ScVal XDR. */
  argumentXdr: Array<string>
}
