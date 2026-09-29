import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { normalizeFootprintKeys } from '../../../lib/network/normalizeFootprintKeys'
import { simulateTransaction } from '../../../lib/network/simulateTransaction'
import { isFunctionName } from '../../../lib/validation/isFunctionName'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export type DiscoveryLoadStatus = 'loading' | 'empty' | 'error' | 'success'

export interface DiscoveredKey {
  keyPath: string
  type: string
}

export interface DiscoveryLoadState {
  status: DiscoveryLoadStatus
  keys: Array<DiscoveredKey>
  error: string | null
  requestedKeyCount: number
}

export interface DiscoveryInputState {
  transaction: string
  arguments: string
}
export function dedupeDiscoveryKeys(
  keys: Array<DiscoveredKey> | undefined,
): Array<DiscoveredKey> {
  const seen = new Set<string>()
  return (keys ?? []).filter((item) => {
    if (typeof item.keyPath !== 'string' || item.keyPath.length === 0) {
      return false
    }
    if (seen.has(item.keyPath)) {
      return false
    }
    seen.add(item.keyPath)
    return true
  })
}

export function buildDiscoveryLoadState(
  partial: Partial<DiscoveryLoadState> = {},
): DiscoveryLoadState {
  const keys = dedupeDiscoveryKeys(partial.keys)
  const requestedKeyCount =
    typeof partial.requestedKeyCount === 'number'
      ? partial.requestedKeyCount
      : keys.length

  return {
    status: partial.status ?? (keys.length === 0 ? 'empty' : 'success'),
    keys,
    error: partial.error ?? null,
    requestedKeyCount,
  }
}

export function DiscoveryStateView({
  state,
  onRetry,
  onPinKey,
  emptyMessage,
}: {
  state: DiscoveryLoadState
  onRetry?: () => void
  onPinKey?: (keyPath: string) => void
  emptyMessage?: string
}) {
  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  const keys = useMemo(() => dedupeDiscoveryKeys(state.keys), [state.keys])

  if (state.status === 'loading') {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Heading
            size="sm"
            as="h3"
            className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
          >
            Loading discovered keys…
          </Heading>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-10 rounded bg-white/5 border border-border-dark animate-pulse"
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (state.status === 'empty') {
    const requestCount = state.requestedKeyCount
    return (
      <Card>
        <div className="p-6 space-y-3">
          <Heading size="sm" as="h3" className="text-white">
            No keys discovered yet
          </Heading>
          <p className="text-text-muted text-sm">
            {emptyMessage ??
              (requestCount === 0
                ? 'No keys were requested for discovery.'
                : `${requestCount} requested key${requestCount === 1 ? '' : 's'} produced no discoverable results.`)}
          </p>
        </div>
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card>
        <div className="p-6 space-y-4 border border-red-500/20 bg-red-500/5 rounded-xl">
          <Heading size="sm" as="h3" className="text-red-300">
            Discovery failed
          </Heading>
          <p className="text-text-muted text-sm">
            {state.error || 'An unknown error occurred while discovering keys.'}
          </p>
          {onRetry && (
            <div>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Heading
        size="sm"
        as="h2"
        className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
      >
        Discovered Keys
      </Heading>

      <div className="grid gap-3">
        {keys.length > 0 ? (
          keys.map((item, idx) => (
            <Card key={`${item.keyPath}-${idx}`}>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-white truncate">
                    {item.keyPath}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {item.type}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <IconButton
                    icon="pin"
                    altText="Add to watchlist"
                    onClick={() => onPinKey?.(item.keyPath)}
                    aria-label="Add to watchlist"
                  />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            No keys discovered yet
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/contracts/$contractId/discovery')({
  beforeLoad({ params }) {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      throw redirect({ to: '/' })
    }

    return {
      normalizedContractId: result.contractId,
    }
  },
  component: DiscoveryRoute,
})

export function DiscoveryRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  const rpcUrl = useLensStore((state) => state.networkConfig.rpcUrl)
  const [functionName, setFunctionName] = useState('')
  const [inputState, setInputState] = useState<DiscoveryInputState>({
    transaction: '',
    arguments: '',
  })
  const { transaction } = inputState
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [simulatedFunction, setSimulatedFunction] = useState('')
  const activeRequest = useRef<AbortController | null>(null)
  const [state, setState] = useState(() =>
    buildDiscoveryLoadState({ status: 'empty', requestedKeyCount: 0 }),
  )
  const isSubmitting = state.status === 'loading'

  useEffect(
    () => () => {
      activeRequest.current?.abort()
      activeRequest.current = null
    },
    [],
  )

  const functionNameIsValid = isFunctionName(functionName)
  const functionNameError =
    !functionNameIsValid && (functionName.length > 0 || attemptedSubmit)
      ? 'Enter a valid Soroban function name (lowercase letters, numbers, and underscores).'
      : null
  const transactionError =
    attemptedSubmit && transaction.trim() === ''
      ? 'Transaction XDR is required.'
      : null

  const handleTransactionChange = (value: string) => {
    setInputState((previous) => ({ ...previous, transaction: value }))
  }

  const handleArgumentsChange = (value: string) => {
    setInputState((previous) => ({ ...previous, arguments: value }))
  }

  const handlePinKey = (keyPath: string) => {
    addToWatchlist(contractId, keyPath)
  }

  const runSimulation = async (
    requestedFunctionName: string,
    requestedTransaction: string,
  ) => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setSimulatedFunction('')
    setState(buildDiscoveryLoadState({ status: 'loading' }))

    try {
      const result = await simulateTransaction({
        rpcUrl,
        transaction: requestedTransaction.trim(),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return

      if (!result.success) {
        setState(
          buildDiscoveryLoadState({
            status: 'error',
            error: result.error ?? 'Simulation failed.',
          }),
        )
        return
      }

      const keys = normalizeFootprintKeys(result).keys.map(
        ({ id, access }) => ({
          keyPath: id,
          type: access === 'read' ? 'Read-only' : 'Read-write',
        }),
      )
      setSimulatedFunction(requestedFunctionName.trim())
      setState(
        buildDiscoveryLoadState({
          status: keys.length > 0 ? 'success' : 'empty',
          keys,
          requestedKeyCount: keys.length,
        }),
      )
    } finally {
      if (!controller.signal.aborted) {
        activeRequest.current = null
      }
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttemptedSubmit(true)
    if (!functionNameIsValid || transaction.trim() === '') return
    void runSimulation(functionName, transaction)
  }

  const handleRetry = () => {
    if (functionNameIsValid && transaction.trim() !== '') {
      void runSimulation(functionName, transaction)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Discovery
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
          <p className="text-text-secondary leading-relaxed text-sm max-w-2xl">
            Simulate a transaction to discover the contract ledger keys it reads
            and writes.
          </p>
        </div>
      </header>

      <form
        className="space-y-4 border-b border-border-dark pb-6"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="discovery-function-name"
              className="text-sm text-white"
            >
              Function name
            </label>
            <input
              id="discovery-function-name"
              name="functionName"
              value={functionName}
              onChange={(event) => setFunctionName(event.target.value)}
              aria-invalid={functionNameError !== null}
              aria-describedby={
                functionNameError ? 'function-name-error' : undefined
              }
              className="w-full rounded border border-border-dark bg-surface-dark px-3 py-2 text-sm text-white"
              autoComplete="off"
            />
            {functionNameError && (
              <p
                id="function-name-error"
                className="text-sm text-red-400"
                role="alert"
              >
                {functionNameError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="discovery-transaction"
              className="text-sm text-white"
            >
              Transaction XDR
            </label>
            <textarea
              id="discovery-transaction"
              name="transaction"
              value={transaction}
              onChange={(event) => handleTransactionChange(event.target.value)}
              aria-invalid={transactionError !== null}
              aria-describedby={
                transactionError ? 'transaction-error' : undefined
              }
              rows={3}
              spellCheck={false}
              className="w-full resize-y rounded border border-border-dark bg-surface-dark px-3 py-2 font-mono text-sm text-white"
            />
            {transactionError && (
              <p
                id="transaction-error"
                className="text-sm text-red-400"
                role="alert"
              >
                {transactionError}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="discovery-arguments" className="text-sm text-white">
              Arguments (JSON reference)
            </label>
            <textarea
              id="discovery-arguments"
              name="arguments"
              value={inputState.arguments}
              onChange={(event) => handleArgumentsChange(event.target.value)}
              rows={3}
              spellCheck={false}
              aria-describedby="discovery-arguments-help"
              className="w-full resize-y rounded border border-border-dark bg-surface-dark px-3 py-2 font-mono text-sm text-white"
            />
            <p
              id="discovery-arguments-help"
              className="text-xs text-text-muted"
            >
              The simulation reads arguments from the transaction XDR.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Simulating…' : 'Simulate transaction'}
          </Button>
        </div>
      </form>

      <DiscoveryStateView
        state={state}
        onRetry={handleRetry}
        onPinKey={handlePinKey}
        emptyMessage={
          simulatedFunction
            ? 'No keys found in the transaction footprint.'
            : undefined
        }
      />
    </div>
  )
}
