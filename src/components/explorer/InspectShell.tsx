import { Button, Card, Heading, IconButton } from '@stellar/design-system'
import { useLensStore } from '../../store/lensStore'

interface InspectShellProps {
  contractId: string
  normalizedContractId: string
  keyPath: string
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
}: InspectShellProps) {
  const addToWatchlist = useLensStore((state) => state.addToWatchlist)

  const metadata: KeyMetadata = {
    durability: 'Persistent',
    lastModifiedLedger: 1234567,
    expirationLedger: 1235000,
  }

  const handlePinKey = () => {
    if (keyPath) {
      addToWatchlist(contractId, keyPath)
    }
  }

  const handleCopyXDR = () => {
    const mockXDR = 'AAAAEgAAAAEAAAABAAAABQAAADEAA...'
    navigator.clipboard.writeText(mockXDR)
  }

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
          <IconButton
            icon="pin"
            altText="Add to watchlist"
            onClick={handlePinKey}
            disabled={!keyPath}
            aria-label="Add to watchlist"
          />
        </div>
      </header>

      <div className="flex items-center gap-2 text-sm text-text-muted font-mono">
        <span>Contract</span>
        <span>/</span>
        <span className="text-white truncate">{keyPath || 'No key selected'}</span>
      </div>

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
              <div className="text-white font-mono">{metadata.durability}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Last Modified Ledger
              </div>
              <div className="text-white font-mono">{metadata.lastModifiedLedger}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                Expiration Ledger
              </div>
              <div className="text-white font-mono">
                {metadata.expirationLedger ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </Card>

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
            <Button variant="secondary" size="sm" onClick={handleCopyXDR}>
              Copy
            </Button>
          </div>
          <div className="bg-surface-dark rounded p-3 max-h-48 overflow-auto">
            <code className="text-xs text-text-secondary font-mono break-words">
              AAAAEgAAAAEAAAABAAAABQAAADEAA...
            </code>
          </div>
        </div>
      </Card>
    </div>
  )
}
