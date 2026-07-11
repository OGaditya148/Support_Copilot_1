import { expect, test, vi, describe, beforeEach } from "vitest";
import { getTickets, updateTicketStatus, updateTicketPriority, softDeleteTicket } from "../app/actions/tickets";
import { auth } from "../lib/auth";
import { PrismaClient } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@prisma/client", () => {
  const mockPrisma = {
    ticket: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

const prisma = new PrismaClient() as any;

describe("Ticket CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("getTickets - cursor pagination & filtering", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "agent" } } as any);
    prisma.ticket.findMany.mockResolvedValue([
      { id: "1", subject: "Test 1", status: "open" },
      { id: "2", subject: "Test 2", status: "open" }
    ]);
    
    const res = await getTickets({ limit: 1, status: "open", sort: "createdAt", order: "desc" });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "open", deletedAt: null }),
      take: 2,
    }));
    expect(res.items.length).toBe(1);
    expect(res.nextCursor).toBe("2");
  });

  test("updateTicketStatus - adds audit log", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "agent" } } as any);
    prisma.ticket.update.mockResolvedValue({ id: "t1", status: "resolved" });

    const res = await updateTicketStatus({ ticketId: "t1", status: "resolved" });
    expect(res.status).toBe("resolved");
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "UPDATE_STATUS", actorId: "user1" })
    }));
  });

  test("softDeleteTicket - enforces admin role", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "agent" } } as any);
    await expect(softDeleteTicket({ ticketId: "t1" })).rejects.toThrow("Forbidden");

    vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "admin" } } as any);
    prisma.ticket.update.mockResolvedValue({ id: "t1", deletedAt: new Date() });
    
    await softDeleteTicket({ ticketId: "t1" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SOFT_DELETE", actorId: "admin1" })
    }));
  });
});
