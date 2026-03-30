import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Heading } from '@stellar/design-system'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/explorer')({
  component: ContractExplorer,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      // For now just log or we could throw a redirect
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

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      {/* Contract Header/Shell */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Contract
            </span>
            <span className="text-text-muted font-mono text-sm hidden sm:inline">
              v1.0.0
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Status
            </span>
            <div className="flex items-center gap-2 text-green-400 font-mono text-sm bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
              <span className="size-2 bg-green-400 rounded-full animate-pulse" />
              Active
            </div>
          </div>
        </div>
      </header>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Heading
                size="sm"
                as="h3"
                className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
              >
                Contract Overview
              </Heading>
              <p className="text-text-secondary leading-relaxed">
                This contract is currently being indexed. The explorer view will
                soon provide a detailed breakdown of ledger entries, events, and
                source code for this address.
              </p>
            </div>

            <div className="pt-4 border-t border-border-dark flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Last Updated
                </span>
                <span className="text-white font-mono text-sm">Just now</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Network
                </span>
                <span className="text-white font-mono text-sm">Testnet</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Quick Actions
            </Heading>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-sm"
              >
                View on Stellar.Expert
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-sm"
              >
                Copy Contract ID
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-sm"
              >
                Download WASM
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Placeholder */}
      <div className="mt-4 border border-dashed border-border-dark rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4 bg-surface-dark/20">
        <div className="size-12 bg-white/5 rounded-full flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-3xl">database</span>
        </div>
        <div className="max-w-md space-y-2">
          <Heading size="sm" as="h4" className="text-white">
            State Explorer Coming Soon
          </Heading>
          <p className="text-text-muted text-sm">
            We're building a powerful way to visualize and interact with this
            contract's state directly from your browser. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  )
}
