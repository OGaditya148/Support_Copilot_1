import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: no Prisma, no bcrypt.
// Callbacks and providers are added in lib/auth.ts (Node runtime only).
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
} satisfies NextAuthConfig;
