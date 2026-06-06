import { createFileRoute, redirect } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/watchlist')({
  component: RouteComponent,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      console.error(`Invalid contract ID: ${result.reason}`)
      throw redirect({ to: '/' })
    }
    return {
      normalizedContractId:  result.contractId,
    }
  },
})

function RouteComponent() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()
  const navigate = Route.useNavigate()

  const watchlistItems = useLensStore((state) =>
    state.getWatchlistForContract(contractId),
  )

  const handleInspect = (keyPath: string) => {
    void navigate({
      to: '/contracts/$contractId/inspect/$keyPath',
      params: { contractId, keyPath },
    })
  }

  return (
    <div className="flex flex-col gap-3 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Watchlist
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId}
          </Heading>
        </div>
      </header>
      {watchlistItems.length === 0 ? (
        <Card>
          <div className="p-6">
            <Heading
              as="h1"
              size="sm"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              No watchlist items
            </Heading>
            <p className="text-text-muted text-sm">
              Pin keys from the Inspector to quickly revisit them here.
            </p>
          </div>
        </Card>
      ) : (
        watchlistItems.map((item, index) => (
          <Card key={index}>
            <div className="border-l-2 border-primary p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Watchlist Item
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
                    <span>Contract</span>
                    <span>/</span>
                    <span className="text-white break-all">{item.keyPath}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleInspect(item.keyPath)}
                >
                  Inspect
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
