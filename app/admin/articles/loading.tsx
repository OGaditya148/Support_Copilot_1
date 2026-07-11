export default function AdminArticlesLoading() {
  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 w-48 bg-muted rounded"></div>
        <div className="h-9 w-64 bg-muted rounded"></div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-muted border-b border-border"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex p-4 border-b border-border items-center">
            <div className="h-5 w-1/3 bg-muted rounded"></div>
            <div className="h-5 w-16 bg-muted rounded mx-auto"></div>
            <div className="h-5 w-24 bg-muted rounded mx-4"></div>
            <div className="h-5 w-12 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </main>
  );
}
