import { z } from "zod";

export const getTicketDetailsSchema = z.object({
  ticketId: z.string(),
});

export const getTicketsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  sort: z.enum(["createdAt", "updatedAt", "priority"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string(),
  status: z.enum(["open", "pending", "resolved", "closed"]),
});

export const updateTicketPrioritySchema = z.object({
  ticketId: z.string(),
  priority: z.enum(["low", "med", "high"]),
});

export const deleteTicketSchema = z.object({
  ticketId: z.string(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  body: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "med", "high"]),
  requesterEmail: z.string().email("Enter a valid requester email"),
});
