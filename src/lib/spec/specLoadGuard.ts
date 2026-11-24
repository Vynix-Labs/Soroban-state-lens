/** Identity of the Inspector context that requested a spec. */
export interface SpecLoadScope {
  networkId: string
  networkPassphrase: string
  rpcUrl: string
  contractId: string
}

export interface SpecLoadAttempt {
  signal: AbortSignal
  /** Commit synchronously only when both the attempt and current scope still match. */
  commitIfCurrent: (currentScope: SpecLoadScope, commit: () => void) => boolean
}

/** Cancel superseded work and prevent stale success or error state from being committed. */
export class SpecLoadGuard {
  private active: AbortController | null = null

  start(scope: SpecLoadScope): SpecLoadAttempt {
    this.cancel()
    const captured = { ...scope }
    const controller = new AbortController()
    this.active = controller
    return {
      signal: controller.signal,
      commitIfCurrent: (currentScope, commit) => {
        if (
          controller.signal.aborted ||
          this.active !== controller ||
          captured.networkId !== currentScope.networkId ||
          captured.networkPassphrase !== currentScope.networkPassphrase ||
          captured.rpcUrl !== currentScope.rpcUrl ||
          captured.contractId !== currentScope.contractId
        )
          return false
        commit()
        return true
      },
    }
  }

  cancel(): void {
    this.active?.abort()
    this.active = null
  }
}
