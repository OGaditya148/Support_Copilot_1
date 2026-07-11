import { getTickets } from "@/app/actions/tickets";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/format-date";

const STATUS_STYLES: Record<string, string> = {
  open:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending:  "bg-amber-500/15  text-amber-400  border-amber-500/30",
  resolved: "bg-sky-500/15    text-sky-400    border-sky-500/30",
  closed:   "bg-zinc-500/15   text-zinc-400   border-zinc-500/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-rose-400 font-semibold",
  med:  "text-amber-400",
  low:  "text-muted-foreground",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : undefined;
  const { items, nextCursor } = await getTickets({
    cursor,
    limit: 25,
    sort: "createdAt",
    order: "desc",
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No tickets yet</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          When customers submit support requests they will appear here.
        </p>
        <a
          href="/tickets/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create your first ticket
        </a>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">
          Tickets
          <span className="ml-2 text-base font-normal text-muted-foreground">({items.length})</span>
        </h1>
        <a
          href="/tickets/new"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </a>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3.5 max-w-xs">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {ticket.subject}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs">
                  {ticket.requesterEmail}
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/tickets/${ticket.id}`} className="block">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[ticket.status] ?? ""}`}>
                      {ticket.status}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/tickets/${ticket.id}`} className={`capitalize text-sm ${PRIORITY_STYLES[ticket.priority] ?? ""}`}>
                    {ticket.priority === "med" ? "Medium" : ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs tabular-nums">
                  <Link href={`/tickets/${ticket.id}`} className="block">
                    {fmtDate(ticket.createdAt)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {items.map((ticket) => (
          <Link
            href={`/tickets/${ticket.id}`}
            key={ticket.id}
            className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 flex-1">
                {ticket.subject}
              </h3>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase flex-shrink-0 ${STATUS_STYLES[ticket.status] ?? ""}`}>
                {ticket.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{ticket.requesterEmail}</span>
              <span>·</span>
              <span className={PRIORITY_STYLES[ticket.priority]}>{ticket.priority}</span>
              <span>·</span>
              <span>{fmtDate(ticket.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {nextCursor && (
        <div className="mt-8 text-center">
          <Link
            href={`/tickets?cursor=${nextCursor}`}
            className="inline-flex items-center gap-2 justify-center rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-5 transition-colors"
          >
            Load More
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>
      )}
    </main>
  );
}
