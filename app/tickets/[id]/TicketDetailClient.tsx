"use client";

import { useOptimistic, useTransition, useState } from "react";
import { sendReply } from "@/app/actions/replies";
import { updateTicketStatus, updateTicketPriority } from "@/app/actions/tickets";
import { fmtDate, fmtDatetime } from "@/lib/format-date";

// ── Types ──────────────────────────────────────────────────────────────────
type Status = "open" | "pending" | "resolved" | "closed";
type Priority = "low" | "med" | "high";

interface Author {
  email: string;
  role: string;
}

interface Reply {
  id: string;
  body: string;
  isAiDraft: boolean;
  createdAt: Date | string;
  author: Author;
}

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: Status;
  priority: Priority;
  requesterEmail: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  replies: Reply[];
}

const STATUS_COLORS: Record<Status, string> = {
  open:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending:  "bg-amber-500/15  text-amber-400  border-amber-500/30",
  resolved: "bg-sky-500/15    text-sky-400    border-sky-500/30",
  closed:   "bg-zinc-500/15   text-zinc-400   border-zinc-500/30",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "text-rose-400",
  med:  "text-amber-400",
  low:  "text-muted-foreground",
};

// ── Status dropdown ────────────────────────────────────────────────────────
function StatusSelect({ ticketId, initial }: { ticketId: string; initial: Status }) {
  const [optimistic, setOptimistic] = useOptimistic(initial);
  const [, startTransition] = useTransition();

  return (
    <select
      value={optimistic}
      onChange={(e) => {
        const next = e.target.value as Status;
        startTransition(async () => {
          setOptimistic(next);
          await updateTicketStatus({ ticketId, status: next });
        });
      }}
      className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring bg-transparent transition-colors ${STATUS_COLORS[optimistic]}`}
    >
      <option value="open">Open</option>
      <option value="pending">Pending</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  );
}

// ── Priority dropdown ──────────────────────────────────────────────────────
function PrioritySelect({ ticketId, initial }: { ticketId: string; initial: Priority }) {
  const [optimistic, setOptimistic] = useOptimistic(initial);
  const [, startTransition] = useTransition();

  return (
    <select
      value={optimistic}
      onChange={(e) => {
        const next = e.target.value as Priority;
        startTransition(async () => {
          setOptimistic(next);
          await updateTicketPriority({ ticketId, priority: next });
        });
      }}
      className={`text-xs font-semibold capitalize border border-border rounded-full px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring bg-transparent transition-colors ${PRIORITY_COLORS[optimistic]}`}
    >
      <option value="low">Low</option>
      <option value="med">Medium</option>
      <option value="high">High</option>
    </select>
  );
}

// ── Reply bubble ───────────────────────────────────────────────────────────
function ReplyBubble({ reply }: { reply: Reply }) {
  const isAi = reply.isAiDraft;
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border text-sm transition-opacity ${isAi ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${isAi ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {isAi ? "AI" : reply.author.email[0]}
          </div>
          <span className="font-medium text-foreground">{reply.author.email}</span>
          {isAi && (
            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5 font-semibold">AI Draft</span>
          )}
        </div>
        <time className="text-xs text-muted-foreground tabular-nums">
          {fmtDatetime(reply.createdAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 pl-9">{reply.body}</p>
    </div>
  );
}

// ── Reply composer ─────────────────────────────────────────────────────────
function ReplyComposer({
  onSubmit,
  pending,
}: {
  onSubmit: (body: string) => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || pending) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <div className="border border-border rounded-xl bg-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add a Reply</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder="Write your reply…"
          required
          disabled={pending}
          className="w-full resize-none bg-muted border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e as any);
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {pending ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </span>
            ) : (
              <span>⌘ + Enter to send</span>
            )}
          </span>
          <button
            type="submit"
            id="btn-send-reply"
            disabled={pending || !value.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Sending…" : "Send Reply"}
            {!pending && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main interactive shell ─────────────────────────────────────────────────
export function TicketDetailClient({
  ticket,
  currentUserEmail,
}: {
  ticket: Ticket;
  currentUserEmail: string;
}) {
  // isPending tracks the sendReply transition — owned HERE alongside useOptimistic
  const [isPending, startTransition] = useTransition();

  const [optimisticReplies, addOptimisticReply] = useOptimistic(
    ticket.replies,
    (state, newBody: string) => [
      ...state,
      {
        id: `optimistic-${Date.now()}`,
        body: newBody,
        isAiDraft: false,
        createdAt: new Date().toISOString(),
        author: { email: currentUserEmail, role: "agent" },
      },
    ]
  );

  // The submit handler lives here so startTransition and addOptimisticReply
  // are in the same component — required for useOptimistic to work.
  function handleSendReply(body: string) {
    startTransition(async () => {
      addOptimisticReply(body);
      await sendReply({ ticketId: ticket.id, body, isAiDraft: false });
    });
  }

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Back link ─── */}
      <a href="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to tickets
      </a>

      {/* ── Ticket header ─── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug flex-1">
            {ticket.subject}
          </h1>
          {/* Editable status + priority */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusSelect ticketId={ticket.id} initial={ticket.status} />
            <PrioritySelect ticketId={ticket.id} initial={ticket.priority} />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-t border-border pt-4">
          <span>
            <span className="font-medium text-foreground">Requester</span>{" "}
            <a href={`mailto:${ticket.requesterEmail}`} className="hover:underline">{ticket.requesterEmail}</a>
          </span>
          <span>
            <span className="font-medium text-foreground">Created</span>{" "}
            {fmtDatetime(ticket.createdAt)}
          </span>
          <span>
            <span className="font-medium text-foreground">Updated</span>{" "}
            {fmtDatetime(ticket.updatedAt)}
          </span>
        </div>

        {/* Body */}
        <div className="bg-muted/40 rounded-lg p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border border-border/50">
          {ticket.body}
        </div>
      </div>

      {/* ── Reply thread ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Thread · {optimisticReplies.length} {optimisticReplies.length === 1 ? "reply" : "replies"}
        </h2>

        {optimisticReplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl">
            <svg className="w-8 h-8 text-muted-foreground mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-muted-foreground">No replies yet — be the first to respond.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimisticReplies.map((reply) => (
              <ReplyBubble key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </section>

      {/* ── Composer ─── */}
      <ReplyComposer
        onSubmit={handleSendReply}
        pending={isPending}
      />
    </main>
  );
}
