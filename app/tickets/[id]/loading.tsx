export default function TicketDetailLoading() {
  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-28 bg-muted rounded" />

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-7 w-3/4 bg-muted rounded" />
            <div className="h-5 w-1/2 bg-muted rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-muted rounded-full" />
            <div className="h-7 w-20 bg-muted rounded-full" />
          </div>
        </div>
        <div className="flex gap-6 border-t border-border pt-4">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2 border border-border/50">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-4/6 bg-muted rounded" />
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        {[0, 1].map((i) => (
          <div key={i} className="border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted" />
              <div className="h-4 w-36 bg-muted rounded" />
            </div>
            <div className="h-3 w-full bg-muted rounded pl-9" />
            <div className="h-3 w-4/5 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded-lg" />
        <div className="flex justify-end">
          <div className="h-9 w-28 bg-muted rounded-lg" />
        </div>
      </div>
    </main>
  );
}
