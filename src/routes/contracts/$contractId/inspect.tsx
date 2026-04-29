import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/inspect')({
  component: InspectRoute,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      console.error(`Invalid contract ID: ${result.reason}`)
    }
    return {
      normalizedContractId: result.ok ? result.contractId : params.contractId,
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    keyPath: (search.keyPath as string) || '',
  }),
})

interface KeyMetadata {
  durability?: string
  lastModifiedLedger: number
  expirationLedger?: number
}

function InspectRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const search = useSearch({ from: Route.id })
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)

  const keyPath = search.keyPath || 'No key selected'

  // Mock metadata for demonstration
  const metadata: KeyMetadata = {
    durability: 'Persistent',
    lastModifiedLedger: 1234567,
    expirationLedger: 1235000,
  }

  const handlePinKey = () => {
    if (search.keyPath) {
      addToWatchlist(contractId, search.keyPath)
    }
  }

  const handleCopyXDR = () => {
    const mockXDR = 'AAAAEgAAAAEAAAABAAAABQAAADEAA...'
    navigator.clipboard.writeText(mockXDR)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Inspector
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IconButton
            icon="pin"
            altText="Add to watchlist"
            onClick={handlePinKey}
            disabled={!search.keyPath}
            aria-label="Add to watchlist"
          />
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
        <span>Contract</span>
        <span>/</span>
        <span className="text-white truncate">{keyPath}</span>
      </div>

      {/* Metadata Card */}
      <Card>
        <div className="p-6 space-y-4">
          <Heading
            size="sm"
            as="h3"
            className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
          >
            Metadata
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Durability
              </div>
              <div className="text-white font-mono">{metadata.durability}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Last Modified Ledger
              </div>
              <div className="text-white font-mono">{metadata.lastModifiedLedger}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Expiration Ledger
              </div>
              <div className="text-white font-mono">
                {metadata.expirationLedger ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Raw XDR Card */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Raw XDR
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyXDR}
            >
              Copy
            </Button>
          </div>
          <div className="bg-surface-dark rounded p-3 max-h-48 overflow-auto">
            <code className="text-xs text-text-secondary font-mono break-words">
              AAAAEgAAAAEAAAABAAAABQAAADEAA...
            </code>
          </div>
        </div>
      </Card>
    </div>
  )
}
