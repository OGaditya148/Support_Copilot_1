"use server";

import { PrismaClient, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { redirect } from "next/navigation";
import { z } from "zod";

// Import the schemas from your new schemas/validation file
import { articleSchema, getArticlesSchema } from "./schemas";

// Note: It is highly recommended to use a single global Prisma client (e.g., from "@/lib/db")
// to prevent running out of database connections in development.
const prisma = new PrismaClient();

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // @ts-ignore
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session.user;
}

export async function upsertArticle(input: z.infer<typeof articleSchema>) {
  await requireAdmin();
  const parsed = articleSchema.parse(input);
  
  const embedding = await generateEmbedding(`${parsed.title}\n${parsed.body}`);
  
  if (parsed.id) {
    // Update
    await prisma.$executeRaw`
      UPDATE "Article"
      SET title = ${parsed.title},
          body = ${parsed.body},
          tags = ${parsed.tags},
          embedding = ${embedding}::vector,
          "updatedAt" = NOW()
      WHERE id = ${parsed.id}
    `;
    return prisma.article.findUnique({ where: { id: parsed.id } });
  } else {
    // Create
    const id = require("crypto").randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Article" (id, title, body, tags, embedding, "updatedAt")
      VALUES (${id}, ${parsed.title}, ${parsed.body}, ${parsed.tags}, ${embedding}::vector, NOW())
    `;
    return prisma.article.findUnique({ where: { id } });
  }
}

export async function softDeleteArticle(articleId: string) {
  await requireAdmin();
  return prisma.article.update({
    where: { id: articleId },
    data: { deletedAt: new Date() },
  });
}

export async function getArticles(input: z.infer<typeof getArticlesSchema>) {
  await requireAdmin();
  const parsed = getArticlesSchema.parse(input);
  
  const whereClause: Prisma.ArticleWhereInput = { deletedAt: null };
  if (parsed.search) {
    whereClause.title = { contains: parsed.search, mode: "insensitive" };
  }

  const items = await prisma.article.findMany({
    where: whereClause,
    take: parsed.limit + 1,
    ...(parsed.cursor && {
      cursor: { id: parsed.cursor },
      skip: 1,
    }),
    orderBy: { updatedAt: "desc" },
  });

  let nextCursor: typeof parsed.cursor = undefined;
  if (items.length > parsed.limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, nextCursor };
}
