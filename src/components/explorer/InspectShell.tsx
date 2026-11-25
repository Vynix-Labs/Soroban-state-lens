import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { Link } from '@tanstack/react-router'
import { isSampleContractId } from '../../lib/demoContract'
import { findCompatibleStructs } from '../../lib/spec/findCompatibleStructs'
import { resolveNodeAtPath } from '../../lib/tree/resolveNodeAtPath'
import { isContractId } from '../../lib/validation/isContractId'
import { useLensStore } from '../../store/lensStore'
import { ContractSpecLoadStatus } from '../../store/types'
import { contractSpecKey } from '../../store/contractSpecSlice'
import { buildInspectBreadcrumb } from './buildInspectBreadcrumb'
import { LocalDemoNotice } from './LocalDemoNotice'
import type { LedgerEntry } from '../../store/types'
import type { Node } from '../../types/node'

interface InspectShellProps {
  contractId: string
  normalizedContractId: string
  keyPath: string
  keyPathError?: string
}

function isNodeLike(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof value.kind === 'string'
  )
}

export function InspectShell({
  contractId,
  normalizedContractId,
  keyPath,
  keyPathError,
}: InspectShellProps) {
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  const autoLoadSpec = useLensStore((state) => state.preferences.autoLoadSpec)
  const networkId = useLensStore((state) => state.networkConfig.networkId)
  const networkPassphrase = useLensStore(
    (state) => state.networkConfig.networkPassphrase,
  )
  const rpcUrl = useLensStore((state) => state.networkConfig.rpcUrl)
  const loadContractSpec = useLensStore((state) => state.loadContractSpec)
  const specLoadStatus = useLensStore((state) =>
    state.getContractSpecLoadStatus(normalizedContractId || contractId),
  )
  const specLoadError = useLensStore((state) =>
    state.getContractSpecError(normalizedContractId || contractId),
  )
  const hasSpec = useLensStore(
    (state) =>
      state.getContractSpec(normalizedContractId || contractId) !== undefined,
  )
  const contractSpec = useLensStore((state) =>
    state.getContractSpec(normalizedContractId || contractId),
  )
  const selectedStructName = useLensStore((state) =>
    state.getCollectionStructInterpretation(
      normalizedContractId || contractId,
      keyPath,
    ),
  )
  const setCollectionStructInterpretation = useLensStore(
    (state) => state.setCollectionStructInterpretation,
  )
  const schemaMismatch = useLensStore((state) =>
    (
      state.contractSpecMismatches[
        contractSpecKey(state.networkConfig, normalizedContractId) ?? ''
      ] ?? []
    ).find((mismatch) => mismatch.keyPath === keyPath),
  )
  const entry = useLensStore((state) =>
    Object.values(state.ledgerData).reduce<LedgerEntry | undefined>(
      (selected, candidate) => {
        const matchesPath =
          keyPath === candidate.key || keyPath.startsWith(`${candidate.key}.`)
        if (
          candidate.contractId !== (normalizedContractId || contractId) ||
          !matchesPath
        ) {
          return selected
        }
        return !selected || candidate.key.length > selected.key.length
          ? candidate
          : selected
      },
      undefined,
    ),
  )
  const [copied, setCopied] = useState(false)
  const [watchlistFeedback, setWatchlistFeedback] = useState('')
  const copiedResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inspectedContractId = normalizedContractId || contractId
  const inspectedNode =
    entry && isNodeLike(entry.value)
      ? resolveNodeAtPath(entry.value, entry.key, keyPath)
      : undefined
  const compatibleStructs = useMemo(
    () =>
      inspectedNode?.kind === 'vec'
        ? findCompatibleStructs(
            inspectedNode,
            contractSpec?.entries.filter((item) => item.kind === 'struct') ??
              [],
          )
        : [],
    [contractSpec, inspectedNode],
  )
  const selectedStruct = compatibleStructs.find(
    (struct) => struct.name === selectedStructName,
  )

  // Opt-in, route-scoped automatic metadata load. The action itself skips
  // cached specs/errors and de-duplicates concurrent loads, so re-opening the
  // same contract never issues a second WASM request.
  useEffect(() => {
    if (!autoLoadSpec || !isContractId(inspectedContractId)) return
    const controller = new AbortController()
    void loadContractSpec(inspectedContractId, { signal: controller.signal })
    return () => controller.abort()
  }, [
    autoLoadSpec,
    inspectedContractId,
    loadContractSpec,
    networkId,
    networkPassphrase,
    rpcUrl,
  ])

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current !== null) {
        clearTimeout(copiedResetTimeout.current)
      }
    }
  }, [])

  const handlePinKey = () => {
    if (entry && keyPath) {
      const added = addToWatchlist(
        normalizedContractId || contractId,
        entry.key,
      )
      setWatchlistFeedback(
        added ? 'Added to watchlist.' : 'Already in watchlist.',
      )
    }
  }

  const handleCopyXDR = async () => {
    if (!entry?.rawXdr) {
      return
    }

    await navigator.clipboard.writeText(entry.rawXdr)
    setCopied(true)

    if (copiedResetTimeout.current !== null) {
      clearTimeout(copiedResetTimeout.current)
    }

    copiedResetTimeout.current = setTimeout(() => {
      setCopied(false)
      copiedResetTimeout.current = null
    }, 1500)
  }

  const breadcrumb = buildInspectBreadcrumb(contractId, keyPath)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-dark pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              Inspector
            </span>
          </div>
          <Heading size="lg" as="h1" className="font-mono break-all text-white">
            {normalizedContractId || contractId}
          </Heading>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/contracts/$contractId/explorer"
            params={{ contractId }}
            search={{
              keys: '',
              mode: isSampleContractId(normalizedContractId || contractId)
                ? 'demo'
                : 'live',
            }}
            aria-label="Back to explorer"
            className="text-sm text-primary hover:underline font-mono whitespace-nowrap"
          >
            ← Explorer
          </Link>
          <IconButton
            icon="pin"
            altText="Add to watchlist"
            onClick={handlePinKey}
            disabled={!entry || !keyPath || Boolean(keyPathError)}
            aria-label="Add to watchlist"
          />
        </div>
      </header>

      {isSampleContractId(normalizedContractId || contractId) && (
        <LocalDemoNotice />
      )}

      {watchlistFeedback ? (
        <p role="status" aria-live="polite" className="text-sm text-text-muted">
          {watchlistFeedback}
        </p>
      ) : null}

      <Card>
        <div className="p-6 space-y-3" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <Heading size="sm" as="h2" className="text-white">
              Contract spec
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void loadContractSpec(inspectedContractId, {
                  force: true,
                })
              }
              disabled={
                !isContractId(inspectedContractId) ||
                specLoadStatus === ContractSpecLoadStatus.LOADING
              }
            >
              {specLoadStatus === ContractSpecLoadStatus.LOADING
                ? 'Loading spec…'
                : hasSpec
                  ? 'Reload spec'
                  : 'Load contract spec'}
            </Button>
          </div>
          {specLoadStatus === ContractSpecLoadStatus.LOADING ? (
            <p role="status" className="text-sm text-text-muted">
              Loading contract spec…
            </p>
          ) : null}
          {specLoadStatus === ContractSpecLoadStatus.ERROR && specLoadError ? (
            <p role="alert" className="text-sm text-red-400">
              Spec load failed: {specLoadError}
            </p>
          ) : null}
          {specLoadStatus === ContractSpecLoadStatus.SUCCESS && hasSpec ? (
            <p className="text-sm text-text-muted">Contract spec loaded.</p>
          ) : null}
          {!isContractId(inspectedContractId) ? (
            <p className="text-sm text-text-muted">
              A valid contract ID is required to load its spec.
            </p>
          ) : null}
        </div>
      </Card>

      <nav
        aria-label="Inspect breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-text-muted font-mono overflow-hidden"
      >
        {breadcrumb.segments.map((segment, index) => {
          const isLast = index === breadcrumb.segments.length - 1
          return (
            <span
              key={`${index}-${segment.label}`}
              className="flex items-center gap-1 min-w-0"
            >
              <span
                title={segment.title ?? segment.label}
                className={
                  isLast
                    ? 'text-white truncate max-w-[16rem]'
                    : 'text-text-muted truncate max-w-[12rem]'
                }
              >
                {segment.label}
              </span>
              {!isLast ? (
                <span className="text-text-muted shrink-0">/</span>
              ) : null}
            </span>
          )
        })}
      </nav>

      {keyPathError ? (
        <Card>
          <div className="p-6 space-y-2">
            <Heading size="sm" as="h2" className="text-white">
              Invalid key path
            </Heading>
            <p className="text-sm text-text-muted">{keyPathError}</p>
          </div>
        </Card>
      ) : null}

      {schemaMismatch ? (
        <Card>
          <div className="p-6 space-y-2" role="alert">
            <Heading size="sm" as="h2" className="text-white">
              Schema mismatch
            </Heading>
            <p className="text-sm text-text-muted font-mono break-all">
              Key path: {schemaMismatch.keyPath}
            </p>
            <p className="text-sm text-text-muted">
              Expected type:{' '}
              <span className="font-mono text-white">
                {schemaMismatch.expectedType}
              </span>
            </p>
            <p className="text-sm text-text-muted">
              Actual type:{' '}
              <span className="font-mono text-white">
                {schemaMismatch.actualType}
              </span>
            </p>
          </div>
        </Card>
      ) : null}

      {!keyPathError && !entry ? (
        <Card>
          <div className="p-6 space-y-2" role="status">
            <Heading size="sm" as="h2" className="text-white">
              Entry not found
            </Heading>
            <p className="text-sm text-text-muted">
              This key path does not match a stored ledger entry.
            </p>
          </div>
        </Card>
      ) : null}

      {entry ? (
        <Card>
          <div className="p-6 space-y-4">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Metadata
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  Durability
                </div>
                <div className="text-white font-mono">
                  {entry.durability ?? 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  Last Modified Ledger
                </div>
                <div className="text-white font-mono">
                  {entry.lastModifiedLedger > 0
                    ? entry.lastModifiedLedger
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  Expiration Ledger
                </div>
                <div className="text-white font-mono">
                  {entry.expirationLedger ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {inspectedNode?.kind === 'vec' ? (
        <Card>
          <div className="p-6 space-y-3">
            <Heading
              size="sm"
              as="h3"
              className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
            >
              Struct interpretation
            </Heading>
            {!hasSpec ? (
              <p className="text-sm text-text-muted">
                Load this contract’s spec to choose a matching struct.
              </p>
            ) : compatibleStructs.length === 0 ? (
              <p role="status" className="text-sm text-text-muted">
                No parsed struct matches every item in this vector.
              </p>
            ) : (
              <>
                <label
                  htmlFor="collection-struct-interpretation"
                  className="block text-sm text-text-muted"
                >
                  Choose a struct with the same field names as the vector items.
                </label>
                <select
                  id="collection-struct-interpretation"
                  aria-label="Struct interpretation"
                  className="w-full rounded border border-white/15 bg-surface-dark px-3 py-2 text-sm text-white"
                  value={selectedStruct?.name ?? ''}
                  onChange={(event) =>
                    setCollectionStructInterpretation(
                      inspectedContractId,
                      keyPath,
                      event.currentTarget.value,
                    )
                  }
                >
                  <option value="">No interpretation selected</option>
                  {compatibleStructs.map((struct) => (
                    <option key={struct.name} value={struct.name}>
                      {struct.name}
                    </option>
                  ))}
                </select>
                {selectedStruct ? (
                  <div role="status" className="space-y-2 text-sm">
                    <p className="text-text-muted">
                      This collection is explicitly interpreted as{' '}
                      <span className="font-mono text-white">
                        {selectedStruct.name}
                      </span>
                      .
                    </p>
                    <p className="text-text-muted">
                      Fields:{' '}
                      <span className="font-mono text-white">
                        {selectedStruct.fields
                          .map((field) => field.name().toString())
                          .join(', ')}
                      </span>
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Card>
      ) : null}

      {entry ? (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Heading
                size="sm"
                as="h3"
                className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
              >
                Raw XDR
              </Heading>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyXDR}
                disabled={!entry.rawXdr}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="bg-surface-dark rounded p-3 max-h-48 overflow-auto">
              <code className="text-xs text-text-secondary font-mono break-words">
                {entry.rawXdr || 'Raw XDR is not available for this entry.'}
              </code>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
