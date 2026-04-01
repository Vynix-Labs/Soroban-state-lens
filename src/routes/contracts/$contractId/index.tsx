import { createFileRoute, redirect } from '@tanstack/react-router'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/')({
  beforeLoad({ params }) {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      throw redirect({ to: '/' })
    }
  },
  component: ContractExplorer,
})

function ContractExplorer() {
  const { contractId } = Route.useParams()

  return (
    <div className="flex flex-col h-full p-6 text-white font-mono">
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Contract Explorer
        </p>
        <h1 className="text-lg font-bold break-all">{contractId}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        Storage entries will appear here.
      </div>
    </div>
  )
}
