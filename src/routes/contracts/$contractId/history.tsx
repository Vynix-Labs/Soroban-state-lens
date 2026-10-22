import { createFileRoute } from '@tanstack/react-router'
import { useSnapshots } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'
import type { ContractSnapshot } from '../../../store/types'

export const Route = createFileRoute(
  ('/contracts/$contractId/history' as unknown) as any,
)({
  beforeLoad: ({ params }) => {
    validateContractRouteParam(params.contractId)
  },
  component: ContractHistoryRoute,
})

function formatTimestamp(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return 'Unknown time'
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }
  return date.toLocaleString()
}

function formatLabel(snapshot: ContractSnapshot): string {
  const label = snapshot.label?.trim()
  return label && label.length > 0 ? label : 'Unlabeled snapshot'
}

function countSnapshotEntries(snapshot: ContractSnapshot): number {
  return snapshot.ledgerData ? Object.keys(snapshot.ledgerData).length : 0
}

function getDiscardedEntryCount(snapshot: ContractSnapshot): number {
  const count = (snapshot as { discardedEntryCount?: unknown }).discardedEntryCount
  if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) {
    return 0
  }
  return Math.floor(count)
}

export function ContractHistoryRoute() {
  const { contractId } = Route.useParams()
  const id = contractId
  const snapshots = useSnapshots(id)

  return (
    <div className="flex flex-col h-full p-6 text-white font-mono">
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Contract History
        </p>
        <h1 className="text-lg font-bold break-all">{id}</h1>
      </div>
      {snapshots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          No snapshots yet.
        </div>
      ) : (
        <ul className="flex-1 overflow-auto space-y-2">
          {snapshots.map((snapshot) => {
            const discardedCount = getDiscardedEntryCount(snapshot)
            return (
              <li
                key={snapshot.id}
                className="border border-gray-800 rounded p-3 bg-gray-900/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold break-all">
                    {formatLabel(snapshot)}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {countSnapshotEntries(snapshot)} entries
                  </span>
                </div>
                {discardedCount > 0 ? (
                  <div className="mt-1 text-xs text-amber-400">
                    {discardedCount} discarded {discardedCount === 1 ? 'entry' : 'entries'} during hydration
                  </div>
                ) : null}
                <div className="mt-1 text-xs text-gray-500">
                  {formatTimestamp(snapshot.timestamp)}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
