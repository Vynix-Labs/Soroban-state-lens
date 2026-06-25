import { createFileRoute } from '@tanstack/react-router'
import { InspectShell } from '../../../components/explorer/InspectShell'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/inspect/$keyPath')({
  component: InspectKeyPathRoute,
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

function InspectKeyPathRoute() {
  const { contractId, keyPath } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()

  return (
    <InspectShell
      contractId={contractId}
      normalizedContractId={normalizedContractId}
      keyPath={keyPath}
    />
  )
}
