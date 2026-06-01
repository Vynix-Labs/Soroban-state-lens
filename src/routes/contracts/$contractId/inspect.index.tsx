import { createFileRoute } from '@tanstack/react-router'
import { InspectShell } from '../../../components/explorer/InspectShell'

export const Route = createFileRoute('/contracts/$contractId/inspect/')({
  component: InspectIndexRoute,
})

function InspectIndexRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId } = Route.useRouteContext()

  return (
    <InspectShell
      contractId={contractId}
      normalizedContractId={normalizedContractId}
      keyPath=""
    />
  )
}
