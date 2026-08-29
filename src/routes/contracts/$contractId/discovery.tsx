import { useCallback, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { useLensStore } from '../../../store/lensStore'
import { validateContractRouteParam } from './-validateContractRouteParam'

export type DiscoveryLoadStatus = 'loading' | 'empty' | 'error' | 'success'

export interface DiscoveredKey {
  keyPath: string
  type: string
}

export interface DiscoveryLoadState {
  status: DiscoveryLoadStatus
  keys: Array<DiscoveredKey>
  error: string | null
  requestedKeyCount: number
}

export function dedupeDiscoveryKeys(
  keys: Array<DiscoveredKey> | undefined,
): Array<DiscoveredKey> {
  const seen = new Set<string>()
  return (keys ?? []).filter((item) => {
    if (
      !item ||
      typeof item.keyPath !== 'string' ||
      item.keyPath.length === 0
    ) {
      return false
    }
    if (seen.has(item.keyPath)) {
      return false
    }
    seen.add(item.keyPath)
    return true
  })
}

export function buildDiscoveryLoadState(
  partial: Partial<DiscoveryLoadState> = {},
): DiscoveryLoadState {
  const keys = dedupeDiscoveryKeys(partial.keys)
  const requestedKeyCount =
    typeof partial.requestedKeyCount === 'number'
      ? partial.requestedKeyCount
      : keys.length

  return {
    status: partial.status ?? (keys.length === 0 ? 'empty' : 'success'),
    keys,
    error: partial.error ?? null,
    requestedKeyCount,
  }
}

export function DiscoveryStateView({
  state,
  onRetry,
  onPinKey,
}: {
  state: DiscoveryLoadState
  onRetry?: () => void
  onPinKey?: (keyPath: string) => void
}) {
  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  const keys = useMemo(() => dedupeDiscoveryKeys(state.keys), [state.keys])

  if (state.status === 'loading') {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Heading
            size="sm"
            as="h3"
            className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
          >
            Loading discovered keys…
          </Heading>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-10 rounded bg-white/5 border border-border-dark animate-pulse"
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (state.status === 'empty') {
    const requestCount = state.requestedKeyCount ?? keys.length
    return (
      <Card>
        <div className="p-6 space-y-3">
          <Heading size="sm" as="h3" className="text-white">
            No keys discovered yet
          </Heading>
          <p className="text-text-muted text-sm">
            {requestCount === 0
              ? 'No keys were requested for discovery.'
              : `${requestCount} requested key${requestCount === 1 ? '' : 's'} produced no discoverable results.`}
          </p>
        </div>
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card>
        <div className="p-6 space-y-4 border border-red-500/20 bg-red-500/5 rounded-xl">
          <Heading size="sm" as="h3" className="text-red-300">
            Discovery failed
          </Heading>
          <p className="text-text-muted text-sm">
            {state.error || 'An unknown error occurred while discovering keys.'}
          </p>
          {onRetry && (
            <div>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Heading
        size="sm"
        as="h2"
        className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
      >
        Discovered Keys
      </Heading>

      <div className="grid gap-3">
        {keys.length > 0 ? (
          keys.map((item, idx) => (
            <Card key={`${item.keyPath}-${idx}`}>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-white truncate">
                    {item.keyPath}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {item.type}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <IconButton
                    icon="pin"
                    altText="Add to watchlist"
                    onClick={() => onPinKey?.(item.keyPath)}
                    aria-label="Add to watchlist"
                  />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            No keys discovered yet
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/contracts/$contractId/discovery')({
  component: DiscoveryRoute,
  beforeLoad: ({ params }) => {
    const result = validateContractRouteParam(params.contractId)
    if (!result.ok) {
      console.error(`Invalid contract ID: ${result.reason}`)
    }
    return {
      normalizedContractId: result.ok ? result.contractId : params.contractId,
      discoveryLoadState: buildDiscoveryLoadState({
        status: 'loading',
        keys: [],
        error: null,
        requestedKeyCount: 0,
      }),
    }
  },
})

function DiscoveryRoute() {
  const { contractId } = Route.useParams()
  const { normalizedContractId, discoveryLoadState } = Route.useRouteContext()
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  const [state, setState] = useState<DiscoveryLoadState>(() =>
    buildDiscoveryLoadState(discoveryLoadState),
  )

  const handlePinKey = (keyPath: string) => {
    addToWatchlist(contractId, keyPath)
  }

  const handleRetry = useCallback(() => {
    setState((current) =>
      buildDiscoveryLoadState({
        ...current,
        status: 'loading',
        error: null,
      }),
    )
  }, [])

  const discoveredKeys = useMemo(
    () =>
      buildDiscoveryLoadState({
        status: state.status,
        keys: state.keys,
        error: state.error,
        requestedKeyCount: state.requestedKeyCount,
      }),
    [state],
  )

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Discovery
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>
      </header>

      <DiscoveryStateView
        state={discoveredKeys}
        onRetry={handleRetry}
        onPinKey={handlePinKey}
      />
    </div>
  )
}
