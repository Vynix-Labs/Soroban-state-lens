import { createFileRoute } from '@tanstack/react-router'
import { Card, Heading, IconButton } from '@stellar/design-system'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/discovery')({
  component: DiscoveryRoute,
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

interface DiscoveredKey {
  keyPath: string
  type: string
}

function DiscoveryRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  
  // Mock discovered keys for demonstration
  const discoveredKeys: Array<DiscoveredKey> = [
    { keyPath: '/contracts/key1', type: 'ContractData' },
    { keyPath: '/contracts/key2', type: 'ContractData' },
    { keyPath: '/contracts/key3', type: 'ContractCode' },
  ]

  const handlePinKey = (keyPath: string) => {
    addToWatchlist(contractId, keyPath)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      {/* Header */}
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
        </div>
      </header>

      {/* Discovery Results */}
      <div className="space-y-4">
        <Heading size="sm" as="h2" className="text-text-muted uppercase tracking-widest text-[11px] font-bold">
          Discovered Keys
        </Heading>

        <div className="grid gap-3">
          {discoveredKeys.length > 0 ? (
            discoveredKeys.map((item, idx) => (
              <Card key={idx}>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-white truncate">{item.keyPath}</div>
                    <div className="text-xs text-text-muted mt-1">{item.type}</div>
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
              No keys discovered yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
