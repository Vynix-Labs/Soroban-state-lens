import { createFileRoute } from '@tanstack/react-router'
import { InspectShell } from '../../../components/explorer/InspectShell'
import { validateContractRouteParam } from './-validateContractRouteParam'
import { validateInspectKeyPathParam } from './-validateInspectKeyPathParam'

export const Route = createFileRoute('/contracts/$contractId/inspect/$keyPath')({
  component: InspectKeyPathRoute,
  beforeLoad: ({ params }) => {
    const contractResult = validateContractRouteParam(params.contractId)
    const keyPathResult = validateInspectKeyPathParam(params.keyPath)

    if (!contractResult.ok) {
      console.error(`Invalid contract ID: ${contractResult.reason}`)
    }

    if (!keyPathResult.ok) {
      console.error(`Invalid inspect key path: ${keyPathResult.reason}`)
    }

    return {
      keyPath: keyPathResult.ok ? keyPathResult.keyPath : '',
      keyPathError: keyPathResult.ok
        ? undefined
        : 'Key path must be a non-empty value.',
      normalizedContractId: contractResult.ok
        ? contractResult.contractId
        : params.contractId,
    }
  },
})

function InspectKeyPathRoute() {
  const { contractId } = Route.useParams()
  const { keyPath, keyPathError, normalizedContractId } =
    Route.useRouteContext()

  return (
    <InspectShell
      contractId={contractId}
      normalizedContractId={normalizedContractId}
      keyPath={keyPath}
      keyPathError={keyPathError}
    />
  )
}
