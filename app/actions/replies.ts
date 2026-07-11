"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding } from "@/lib/embeddings";

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// requireAuth now returns a session whose .user.id is ALWAYS a real DB User.id
// (guaranteed by the signIn callback upsert in lib/auth.ts)
async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string; role: string };
}

// Schemas are local (not exported) — "use server" files may only export async functions
const generateAiDraftSchema = z.object({
  ticketId: z.string(),
  context: z.string().optional(),
});

const sendReplySchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1),
  isAiDraft: z.boolean().default(false),
});

export async function generateAiDraft(input: {
  ticketId: string;
  context?: string;
}) {
  const user = await requireAuth();
  const parsed = generateAiDraftSchema.parse(input);

  const ticket = await prisma.ticket.findUnique({ where: { id: parsed.ticketId } });
  if (!ticket) throw new Error("Ticket not found");

  const queryEmbedding = await generateEmbedding(
    ticket.body + (parsed.context ? `\n${parsed.context}` : "")
  );

  const similarArticles: Array<{ id: string; title: string; body: string }> =
    await prisma.$queryRaw`
      SELECT id, title, body
      FROM "Article"
      WHERE "deletedAt" IS NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT 3
    `;

  const kbContext = similarArticles
    .map((a) => `Title: ${a.title}\n\n${a.body}`)
    .join("\n\n---\n\n");

  const prompt = `You are a helpful support agent. Draft a reply to the user's ticket based on the following Knowledge Base articles.
If the articles don't contain the answer, politely state you are looking into it.

Ticket Subject: ${ticket.subject}
Ticket Body: ${ticket.body}
${parsed.context ? `Agent Notes: ${parsed.context}` : ""}

Knowledge Base:
${kbContext}

Draft the reply now:`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  let draftBody = "";
  if (response.content?.[0]?.type === "text") {
    draftBody = response.content[0].text;
  }

  // user.id is a real DB User.id — use it directly, no extra lookup needed
  const reply = await prisma.reply.create({
    data: {
      ticketId: ticket.id,
      authorId: user.id,
      body: draftBody,
      isAiDraft: true,
    },
  });

  return reply;
}

export async function sendReply(input: {
  ticketId: string;
  body: string;
  isAiDraft: boolean;
}) {
  const user = await requireAuth();
  const parsed = sendReplySchema.parse(input);

  // user.id is a real DB User.id — use it directly, no extra lookup needed
  const reply = await prisma.reply.create({
    data: {
      ticketId: parsed.ticketId,
      authorId: user.id,
      body: parsed.body,
      isAiDraft: parsed.isAiDraft,
    },
  });

  // Revalidate so the server component refetches the real reply list,
  // replacing the optimistic entry with confirmed data.
  revalidatePath(`/tickets/${parsed.ticketId}`);

  return reply;
}
