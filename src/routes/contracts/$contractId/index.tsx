import { createFileRoute, redirect } from '@tanstack/react-router'
import { validateContractRouteParam } from './-validateContractRouteParam'

export function redirectContractIndex(contractId: string): never {
  const result = validateContractRouteParam(contractId)
  if (!result.ok) {
    throw redirect({ to: '/' })
  }

  throw redirect({
    to: '/contracts/$contractId/explorer',
    params: { contractId: result.contractId },
    search: { keys: '' },
  })
}

export const Route = createFileRoute('/contracts/$contractId/')({
  beforeLoad: ({ params }) => redirectContractIndex(params.contractId),
})
