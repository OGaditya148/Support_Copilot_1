-- Migration: init
-- Enables pgvector extension first so the shadow DB has the type available
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
CREATE TYPE "Role" AS ENUM ('admin', 'agent');
CREATE TYPE "TicketStatus" AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE "TicketPriority" AS ENUM ('low', 'med', 'high');

-- User
CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "passwordHash" TEXT,
    "role"         "Role" NOT NULL DEFAULT 'agent',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Ticket
CREATE TABLE "Ticket" (
    "id"             TEXT NOT NULL,
    "subject"        TEXT NOT NULL,
    "body"           TEXT NOT NULL,
    "status"         "TicketStatus" NOT NULL DEFAULT 'open',
    "priority"       "TicketPriority" NOT NULL DEFAULT 'med',
    "requesterEmail" TEXT NOT NULL,
    "assigneeId"     TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- Reply
CREATE TABLE "Reply" (
    "id"        TEXT NOT NULL,
    "ticketId"  TEXT NOT NULL,
    "authorId"  TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "isAiDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- Article
CREATE TABLE "Article" (
    "id"        TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "tags"      TEXT[],
    "embedding" vector(1536),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- AuditLog
CREATE TABLE "AuditLog" (
    "id"        TEXT NOT NULL,
    "entity"    TEXT NOT NULL,
    "entityId"  TEXT NOT NULL,
    "action"    TEXT NOT NULL,
    "actorId"   TEXT NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "Ticket"   ADD CONSTRAINT "Ticket_assigneeId_fkey"  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reply"    ADD CONSTRAINT "Reply_ticketId_fkey"     FOREIGN KEY ("ticketId")  REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reply"    ADD CONSTRAINT "Reply_authorId_fkey"     FOREIGN KEY ("authorId")  REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"   FOREIGN KEY ("actorId")   REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
