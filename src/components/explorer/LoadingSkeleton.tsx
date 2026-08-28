import { Heading, Card } from '@stellar/design-system'

export function LoadingSkeleton() {
  return (
    <Card>
      <div className="p-6 space-y-4" role="region" aria-busy="true" aria-labelledby="loading-heading">
        <Heading
          size="sm"
          as="h3"
          id="loading-heading"
          className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
        >
          Loading State
        </Heading>

        <div>
          <div role="status" aria-live="polite">Loading explorer rows</div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
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

export default LoadingSkeleton
