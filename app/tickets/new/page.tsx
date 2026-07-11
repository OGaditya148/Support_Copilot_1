"use client";

import { useTransition, useState } from "react";
import { createTicket } from "@/app/actions/tickets";
import Link from "next/link";

type FieldErrors = Partial<Record<"subject" | "body" | "priority" | "requesterEmail", string[]>>;

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {messages[0]}
    </p>
  );
}

export default function NewTicketPage() {
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    const fd = new FormData(e.currentTarget);
    const data = {
      subject: fd.get("subject") as string,
      body: fd.get("body") as string,
      priority: fd.get("priority") as "low" | "med" | "high",
      requesterEmail: fd.get("requesterEmail") as string,
    };

    // Client-side pre-validation mirrors Zod rules for instant feedback
    const errors: FieldErrors = {};
    if (!data.subject || data.subject.length < 3)
      errors.subject = ["Subject must be at least 3 characters"];
    if (!data.body || data.body.length < 10)
      errors.body = ["Description must be at least 10 characters"];
    if (!data.requesterEmail || !/\S+@\S+\.\S+/.test(data.requesterEmail))
      errors.requesterEmail = ["Enter a valid requester email"];

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      try {
        await createTicket(data);
        // createTicket redirects on success — we only reach here on error
      } catch (err: any) {
        // ZodError from server
        if (err?.issues) {
          const mapped: FieldErrors = {};
          for (const issue of err.issues) {
            const key = issue.path[0] as keyof FieldErrors;
            mapped[key] = [...(mapped[key] ?? []), issue.message];
          }
          setFieldErrors(mapped);
        } else if (err?.message && !err.message.includes("NEXT_REDIRECT")) {
          setGlobalError(err.message);
        }
      }
    });
  }

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to tickets
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Ticket</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below to open a new support ticket.
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 01-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              disabled={pending}
              placeholder="e.g. Cannot log in after password reset"
              className={`w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60 ${fieldErrors.subject ? "border-destructive" : "border-border"}`}
            />
            <FieldError messages={fieldErrors.subject} />
          </div>

          {/* Requester Email */}
          <div>
            <label htmlFor="requesterEmail" className="block text-sm font-medium text-foreground mb-1.5">
              Requester Email <span className="text-destructive">*</span>
            </label>
            <input
              id="requesterEmail"
              name="requesterEmail"
              type="email"
              required
              disabled={pending}
              placeholder="customer@example.com"
              className={`w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60 ${fieldErrors.requesterEmail ? "border-destructive" : "border-border"}`}
            />
            <FieldError messages={fieldErrors.requesterEmail} />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1.5">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="med"
              disabled={pending}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
            <FieldError messages={fieldErrors.priority} />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={6}
              disabled={pending}
              placeholder="Describe the issue in detail…"
              className={`w-full resize-none px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60 ${fieldErrors.body ? "border-destructive" : "border-border"}`}
            />
            <FieldError messages={fieldErrors.body} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/tickets"
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            id="btn-create-ticket"
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                Create Ticket
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
