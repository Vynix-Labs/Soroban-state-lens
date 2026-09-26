import { useEffect, useRef, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { normalizeFootprintKeys } from '../../../lib/network/normalizeFootprintKeys'
import { simulateTransaction } from '../../../lib/network/simulateTransaction'
import { isFunctionName } from '../../../lib/validation/isFunctionName'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

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

interface DiscoveredKey {
  keyPath: string
  type: string
}

function DiscoveryRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  const rpcUrl = useLensStore((state) => state.networkConfig.rpcUrl)
  const [functionName, setFunctionName] = useState('')
  const [transaction, setTransaction] = useState('')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSimulated, setHasSimulated] = useState(false)
  const [simulatedFunction, setSimulatedFunction] = useState('')
  const [discoveredKeys, setDiscoveredKeys] = useState<Array<DiscoveredKey>>([])
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)

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

  const handlePinKey = (keyPath: string) => {
    addToWatchlist(contractId, keyPath)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttemptedSubmit(true)
    if (!functionNameIsValid || transaction.trim() === '') return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setError(null)
    setDiscoveredKeys([])
    setHasSimulated(false)
    setIsSubmitting(true)

    try {
      const result = await simulateTransaction({
        rpcUrl,
        transaction: transaction.trim(),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return

      if (!result.success) {
        setError(result.error ?? 'Simulation failed.')
        return
      }

      setHasSimulated(true)
      setSimulatedFunction(functionName.trim())
      setDiscoveredKeys(
        normalizeFootprintKeys(result).keys.map(({ id, access }) => ({
          keyPath: id,
          type: access === 'read' ? 'Read-only' : 'Read-write',
        })),
      )
    } finally {
      if (!controller.signal.aborted) {
        activeRequest.current = null
        setIsSubmitting(false)
      }
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
              onChange={(event) => setTransaction(event.target.value)}
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
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <Heading
          size="sm"
          as="h2"
          className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
        >
          Discovered Keys
        </Heading>
        {simulatedFunction && (
          <p className="text-sm text-text-muted">
            Function: {simulatedFunction}
          </p>
        )}

        <div className="grid gap-3">
          {discoveredKeys.length > 0 ? (
            discoveredKeys.map((item) => (
              <Card key={item.keyPath}>
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
                      onClick={() => handlePinKey(item.keyPath)}
                      aria-label="Add to watchlist"
                    />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-text-muted">
              {hasSimulated
                ? 'No keys found in the transaction footprint.'
                : 'No keys discovered yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
