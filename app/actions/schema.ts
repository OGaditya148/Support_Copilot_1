import { z } from "zod";

export const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const getArticlesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  search: z.string().optional(),
});
