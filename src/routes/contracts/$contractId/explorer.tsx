import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'
import { selectLedgerEntriesByContractId } from '../../../lib/selectors/selectLedgerEntriesByContractId'
import { ContractLoadStatus } from '../../../store/types'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/explorer')({
  component: ContractExplorer,
  validateSearch: (search: Record<string, unknown>) => ({
    keys: typeof search.keys === 'string' ? search.keys : '',
  }),
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      console.error(`Invalid contract ID: ${result.reason}`)
    }
    return {
      normalizedContractId: result.ok ? result.contractId : params.contractId,
    }
  },
})

function ContractExplorer() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const search = Route.useSearch()

  const setActiveContractId = useLensStore((state) => state.setActiveContractId)
  const setContractLoadStatus = useLensStore(
    (state) => state.setContractLoadStatus,
  )
  const setContractLoadError = useLensStore((state) => state.setContractLoadError)
  const loadContract = useLensStore((state) => state.loadContract)
  const contractLoadStatus = useLensStore((state) => state.contractLoadStatus)
  const contractLoadError = useLensStore((state) => state.contractLoadError)

  const ledgerEntries = useLensStore((state) =>
    selectLedgerEntriesByContractId(state, contractId),
  )

  const keys = useMemo(
    () =>
      search.keys
        .split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0),
    [search.keys],
  )

  useEffect(() => {
    setActiveContractId(contractId)

    if (keys.length === 0) {
      setContractLoadError(null)
      setContractLoadStatus(ContractLoadStatus.EMPTY)
      return
    }

    void loadContract(contractId, keys)
  }, [
    contractId,
    keys,
    loadContract,
    setActiveContractId,
    setContractLoadError,
    setContractLoadStatus,
  ])

  const handleRetry = () => {
    if (keys.length === 0) {
      setContractLoadError(null)
      setContractLoadStatus(ContractLoadStatus.EMPTY)
      return
    }

    void loadContract(contractId, keys)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Contract
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Retry Load
          </Button>
        </div>
      </header>

      {contractLoadStatus === ContractLoadStatus.LOADING && (
        <Card>
          <div className="p-6 space-y-4">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Loading State
            </Heading>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-10 rounded bg-white/5 border border-border-dark animate-pulse"
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {contractLoadStatus === ContractLoadStatus.EMPTY && (
        <Card>
          <div className="p-6 space-y-3">
            <Heading size="sm" as="h3" className="text-white">
              No Contract Data Found
            </Heading>
            <p className="text-text-muted text-sm">
              The current contract query completed, but no ledger entries were
              returned.
            </p>
            {keys.length === 0 && (
              <p className="text-text-muted text-xs">
                Add one or more base64 ledger keys via `?keys=...` to load
                entries in this route.
              </p>
            )}
          </div>
        </Card>
      )}

      {contractLoadStatus === ContractLoadStatus.ERROR && (
        <Card>
          <div className="p-6 space-y-4 border border-red-500/20 bg-red-500/5 rounded-xl">
            <Heading size="sm" as="h3" className="text-red-300">
              Failed To Load Contract Data
            </Heading>
            <p className="text-text-muted text-sm">
              {contractLoadError || 'An unknown error occurred while loading.'}
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        </Card>
      )}

      {contractLoadStatus === ContractLoadStatus.SUCCESS && (
        <Card>
          <div className="p-6 space-y-4">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Loaded Entries ({ledgerEntries.length})
            </Heading>

            <div className="space-y-2">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.key}
                  className="rounded border border-border-dark bg-surface-dark/30 p-3"
                >
                  <div className="font-mono text-xs text-white break-all">
                    {entry.key}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
