import { expect, test, vi, describe, beforeEach } from "vitest";
import { generateAiDraft, sendReply } from "../app/actions/replies";
import { auth } from "../lib/auth";
import { generateEmbedding } from "../lib/embeddings";
import { PrismaClient } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/embeddings", () => ({ generateEmbedding: vi.fn() }));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "Hello! This is a drafted reply." }]
        })
      }
    }))
  };
});

vi.mock("@prisma/client", () => {
  const mockPrisma = {
    ticket: { findUnique: vi.fn() },
    reply: { create: vi.fn() },
    $queryRaw: vi.fn(),
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

const prisma = new PrismaClient() as any;

describe("Replies & AI Draft Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("generateAiDraft retrieves articles, generates draft, and saves as isAiDraft", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user1", role: "agent" } } as any);
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2]);
    prisma.ticket.findUnique.mockResolvedValue({ id: "t1", subject: "Help", body: "Need help" });
    prisma.$queryRaw.mockResolvedValue([{ id: "a1", title: "Article 1", body: "KB body" }]);
    prisma.reply.create.mockResolvedValue({ id: "r1", isAiDraft: true, body: "Hello! This is a drafted reply." });

    const draft = await generateAiDraft({ ticketId: "t1" });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.reply.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isAiDraft: true,
        body: "Hello! This is a drafted reply."
      })
    });
    expect(draft.isAiDraft).toBe(true);
  });
});
