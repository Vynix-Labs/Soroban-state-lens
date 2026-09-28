import { useEffect, useRef, useState } from 'react'
import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { Link } from '@tanstack/react-router'
import { useLensStore } from '../../store/lensStore'
import { buildInspectBreadcrumb } from './buildInspectBreadcrumb'
import type { LedgerEntry } from '../../store/types'

interface InspectShellProps {
  contractId: string
  normalizedContractId: string
  keyPath: string
  keyPathError?: string
}

interface KeyMetadata {
  durability?: string
  lastModifiedLedger: number
  expirationLedger?: number
}

export function InspectShell({
  contractId,
  normalizedContractId,
  keyPath,
  keyPathError,
}: InspectShellProps) {
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)
  const entry = useLensStore((state) =>
    Object.values(state.ledgerData).reduce<LedgerEntry | undefined>(
      (selected, candidate) => {
        const matchesPath =
          keyPath === candidate.key || keyPath.startsWith(`${candidate.key}.`)
        if (candidate.contractId !== contractId || !matchesPath) {
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
  const copiedResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metadata: KeyMetadata | null = entry
    ? {
        durability: entry.durability,
        lastModifiedLedger: entry.lastModifiedLedger,
        expirationLedger: entry.expirationLedger,
      }
    : null

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current !== null) {
        clearTimeout(copiedResetTimeout.current)
      }
    }
  }, [])

  const handlePinKey = () => {
    if (entry && keyPath) {
      addToWatchlist(contractId, entry.key)
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
            search={{ keys: '' }}
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
                  {metadata?.durability ?? 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  Last Modified Ledger
                </div>
                <div className="text-white font-mono">
                  {metadata?.lastModifiedLedger ?? 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                  Expiration Ledger
                </div>
                <div className="text-white font-mono">
                  {metadata?.expirationLedger ?? 'N/A'}
                </div>
              </div>
            </div>
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
