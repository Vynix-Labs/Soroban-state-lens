import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'
import { useLensStore, useWatchlist } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/watchlist')({
  component: WatchlistRoute,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      console.error(`Invalid contract ID: ${result.reason}`)
      throw redirect({ to: '/' })
    }

    return {
      normalizedContractId: result.contractId,
    }
  },
})

function WatchlistRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const watchlistItems = useWatchlist(contractId)
  const removeFromWatchlist = useLensStore((state) => state.removeFromWatchlist)

  const handleInspect = (keyPath: string) => {
    void navigate({
      to: '/contracts/$contractId/inspect/$keyPath',
      params: { contractId, keyPath },
    })
  }

  const handleRemove = (keyPath: string) => {
    removeFromWatchlist(contractId, keyPath)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Watchlist
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>
      </header>

      {watchlistItems.length === 0 ? (
        <Card>
          <div className="p-6 space-y-4">
            <Heading
              size="sm"
              as="h2"
              className="text-white font-bold"
            >
              No saved watchlist items
            </Heading>
            <p className="text-text-muted text-sm">
              You do not have any pinned keys for this contract yet.
              Navigate from discovery or inspect a key to add items to the watchlist.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {watchlistItems.map((item) => (
            <Card key={item.keyPath}>
              <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-mono text-white break-all">
                    {item.keyPath}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    Pinned {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleInspect(item.keyPath)}
                  >
                    Inspect
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemove(item.keyPath)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
