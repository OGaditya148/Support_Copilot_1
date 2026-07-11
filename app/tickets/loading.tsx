export default function TicketsLoading() {
  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 w-32 bg-muted rounded"></div>
        <div className="h-9 w-48 bg-muted rounded"></div>
      </div>
      
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-muted border-b border-border"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex p-4 border-b border-border items-center">
            <div className="h-5 w-1/3 bg-muted rounded mr-auto"></div>
            <div className="h-5 w-16 bg-muted rounded mx-4"></div>
            <div className="h-5 w-16 bg-muted rounded mx-4"></div>
            <div className="h-5 w-24 bg-muted rounded mx-4"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card">
            <div className="h-5 w-2/3 bg-muted rounded mb-3"></div>
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-muted rounded"></div>
              <div className="h-3 w-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
