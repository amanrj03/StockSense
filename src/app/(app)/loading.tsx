export default function Loading() {
  return (
    <div role="status" aria-label="Loading inventory page" className="space-y-6">
      <span className="sr-only">Loading inventory data…</span>
      <div className="h-7 w-52 animate-pulse rounded bg-muted" aria-hidden="true" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-md border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-md border border-border bg-card" aria-hidden="true" />
    </div>
  );
}