export function LoadingSkeleton() {
  return (
    <div className="Card Card--primary">
      <div
        className="p-6 space-y-4"
        role="region"
        aria-busy="true"
        aria-labelledby="loading-heading"
      >
        <h3
          id="loading-heading"
          className="text-text-muted uppercase tracking-widest text-[11px] font-bold"
        >
          Loading State
        </h3>

        <div>
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading explorer rows"
          >
            Loading explorer rows
          </div>
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
    </div>
  )
}

export default LoadingSkeleton
