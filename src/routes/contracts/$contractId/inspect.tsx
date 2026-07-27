import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { validateContractRouteParam } from './-validateContractRouteParam'

export const Route = createFileRoute('/contracts/$contractId/inspect')({
  component: InspectLayoutRoute,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      throw redirect({ to: '/' })
    }
    return {
      normalizedContractId: result.contractId,
    }
  },
})

function InspectLayoutRoute() {
  return <Outlet />
}
