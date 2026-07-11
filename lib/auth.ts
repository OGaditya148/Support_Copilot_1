import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        // Return real DB row — id and role flow into the JWT below
        return { id: user.id, email: user.email, name: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    /**
     * jwt() is called on every request that needs a token.
     * `account` is only present on the FIRST sign-in for that provider.
     *
     * For Google OAuth: upsert the DB User row here (not in signIn()) so
     * we can write the real DB id directly into token.id.  Mutating the
     * `user` argument inside signIn() does NOT propagate to jwt() in v5 —
     * the signIn snapshot is a separate copy.
     *
     * For Credentials: authorize() already returned the real DB id, which
     * lands in user.id when account?.provider === "credentials".
     */
    async jwt({ token, user, account }: any) {
      if (account && user) {
        // ── First sign-in for this provider ──────────────────────────────
        if (account.provider === "google") {
          // Upsert: guarantees a User row exists and gives us the real DB id
          const dbUser = await prisma.user.upsert({
            where: { email: token.email as string },
            update: {},
            create: { email: token.email as string, role: "agent" },
          });
          token.id   = dbUser.id;
          token.role = dbUser.role;
        } else {
          // Credentials: user.id is the real DB id from authorize()
          token.id   = user.id;
          token.role = (user as any).role ?? "agent";
        }
      }
      // On subsequent requests token.id is already set — return as-is
      return token;
    },

    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
});
