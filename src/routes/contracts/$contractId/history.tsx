import { createFileRoute } from '@tanstack/react-router'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute(
  ('/contracts/$contractId/history' as unknown) as any,
)({
  beforeLoad: ({ params }) => {
    validateContractRouteParam(params.contractId)
  },
  component: ContractHistoryRoute,
})

function ContractHistoryRoute() {
  const { contractId } = Route.useParams()
  const id = contractId

  return (
    <div className="flex flex-col h-full p-6 text-white font-mono">
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Contract History
        </p>
        <h1 className="text-lg font-bold break-all">{id}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        History and snapshot tools will appear here.
      </div>
    </div>
  )
}
