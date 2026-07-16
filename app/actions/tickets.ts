"use server";

import { PrismaClient, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { 
  getTicketDetailsSchema,
  getTicketsSchema, 
  updateTicketStatusSchema, 
  updateTicketPrioritySchema, 
  deleteTicketSchema,
  createTicketSchema,
} from "@/lib/zod-schemas";
import { redirect } from "next/navigation";
import { z } from "zod";

// Recommended: Replace with your global prisma singleton if available (e.g., import { prisma } from "@/lib/db")
const prisma = new PrismaClient();

// Returns a session user whose .id is ALWAYS a real DB User.id
// (guaranteed by the jwt() upsert in lib/auth.ts)
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user as { id: string; email: string; role: string };
  // TEMP: verify DB id is flowing correctly — remove after confirming
  console.log("[requireAuth] user.id =", user.id, "| email =", user.email);
  return user;
}

export async function getTicketDetails(input: z.infer<typeof getTicketDetailsSchema>) {
  await requireAuth();
  const parsed = getTicketDetailsSchema.parse(input);
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.ticketId, deletedAt: null },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { email: true, role: true } } }
      }
    }
  });

  if (!ticket) throw new Error("Ticket not found");
  return ticket;
}

export async function getTickets(input: z.infer<typeof getTicketsSchema>) {
  await requireAuth();
  const parsed = getTicketsSchema.parse(input);
  
  const whereClause: Prisma.TicketWhereInput = { deletedAt: null };
  if (parsed.search) {
    whereClause.OR = [
      { subject: { contains: parsed.search, mode: "insensitive" } },
      { body: { contains: parsed.search, mode: "insensitive" } },
    ];
  }
  if (parsed.status) {
    whereClause.status = parsed.status;
  }

  const items = await prisma.ticket.findMany({
    where: whereClause,
    take: parsed.limit + 1, // Fetch one extra to check if there's a next page
    ...(parsed.cursor && {
      cursor: { id: parsed.cursor },
      skip: 1, // Skip the cursor itself
    }),
    orderBy: { [parsed.sort]: parsed.order },
  });

  let nextCursor: typeof parsed.cursor = undefined;
  if (items.length > parsed.limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, nextCursor };
}

export async function updateTicketStatus(input: z.infer<typeof updateTicketStatusSchema>) {
  const user = await requireAuth();
  const parsed = updateTicketStatusSchema.parse(input);

  const ticket = await prisma.ticket.update({
    where: { id: parsed.ticketId },
    data: { status: parsed.status },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Ticket",
      entityId: ticket.id,
      action: "UPDATE_STATUS",
      actorId: user.id,
      metadata: { newStatus: parsed.status },
    }
  });

  return ticket;
}

export async function updateTicketPriority(input: z.infer<typeof updateTicketPrioritySchema>) {
  const user = await requireAuth();
  const parsed = updateTicketPrioritySchema.parse(input);

  const ticket = await prisma.ticket.update({
    where: { id: parsed.ticketId },
    data: { priority: parsed.priority },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Ticket",
      entityId: ticket.id,
      action: "UPDATE_PRIORITY",
      actorId: user.id,
      metadata: { newPriority: parsed.priority },
    }
  });

  return ticket;
}

export async function softDeleteTicket(input: z.infer<typeof deleteTicketSchema>) {
  const user = await requireAuth();
  
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  const parsed = deleteTicketSchema.parse(input);

  const ticket = await prisma.ticket.update({
    where: { id: parsed.ticketId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Ticket",
      entityId: ticket.id,
      action: "SOFT_DELETE",
      actorId: user.id,
    }
  });

  return ticket;
}

export async function createTicket(input: z.infer<typeof createTicketSchema>) {
  const user = await requireAuth();
  const parsed = createTicketSchema.parse(input);

  // Use a transaction block to ensure both database operations succeed atomically 
  // before the redirect intercepts the execution flow
  const ticket = await prisma.$transaction(async (tx) => {
    const newTicket = await tx.ticket.create({
      data: {
        subject: parsed.subject,
        body: parsed.body,
        priority: parsed.priority,
        requesterEmail: parsed.requesterEmail,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "Ticket",
        entityId: newTicket.id,
        action: "CREATE",
        actorId: user.id,
        metadata: { subject: newTicket.subject },
      },
    });

    return newTicket;
  });

  // Safe to redirect now that the transactions are fully completed and closed
  redirect(`/tickets/${ticket.id}`);
}
