import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card, Heading } from '@stellar/design-system'
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
  component: ContractDiscovery,
})

function ContractDiscovery() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()

  return (
    <main className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full text-white">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
            Contract Discovery
          </span>
          <span className="text-text-muted text-sm font-mono">
            /contracts/{normalizedContractId || contractId}/discovery
          </span>
        </div>
        <Heading size="lg" as="h1" className="font-mono break-all text-white">
          {normalizedContractId || contractId}
        </Heading>
        <p className="max-w-2xl text-text-secondary text-sm leading-relaxed">
          This dedicated discovery route is contract-aware and refresh-safe. It
          reserves space for simulation-driven key discovery workflows while
          avoiding live simulation and footprint parsing for now.
        </p>
      </header>

      <Card>
        <div className="p-6 space-y-4">
          <Heading
            size="sm"
            as="h2"
            className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
          >
            Discovery Workspace
          </Heading>
          <p className="text-text-secondary leading-relaxed text-sm">
            The discovery experience will be built here. This placeholder keeps
            the contract context visible and ensures the route remains stable on
            direct refresh.
          </p>
          <div className="rounded border border-border-dark bg-surface-dark/70 p-4">
            <p className="text-text-muted text-sm">
              Refresh this page directly to verify the route still resolves.
            </p>
          </div>
        </div>
      </Card>
    </main>
  )
}
