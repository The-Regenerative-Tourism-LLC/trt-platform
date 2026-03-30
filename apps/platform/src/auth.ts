/**
 * Auth.js v5 (NextAuth) — central auth configuration.
 *
 * Responsibilities: signup/login/logout/session/OAuth/role resolution only.
 * Domain logic (onboarding, scoring, profiles) lives in its own layer.
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { AppRole } from "@prisma/client";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Required when deployed behind Railway's (or any) reverse proxy.
  // Without this, Auth.js rejects requests whose Host header differs from
  // the canonical AUTH_URL, causing sign-in/callback failures in production.
  trustHost: true,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On first sign-in, embed roles into the token
      if (user?.id) {
        const roles = await prisma.userRole.findMany({
          where: { userId: user.id },
        });
        token.roles = roles.map((r) => r.role) as AppRole[];
        token.needsRoleSelection = roles.length === 0;
      }

      // On explicit session update (e.g. after role selection), re-fetch roles
      if (trigger === "update") {
        const userId = token.sub!;
        const roles = await prisma.userRole.findMany({
          where: { userId },
        });
        token.roles = roles.map((r) => r.role) as AppRole[];
        token.needsRoleSelection = roles.length === 0;
      }

      // Self-heal: JWT may carry stale needsRoleSelection=true from a partial
      // previous attempt. If roles are already in the token, trust them.
      // Falls back to a DB re-check only when the token claims no roles exist.
      // Wrapped in try/catch — Prisma is not available in Edge runtime contexts.
      if (
        token.needsRoleSelection === true &&
        token.sub &&
        !user &&
        trigger !== "update"
      ) {
        const tokenRoles = token.roles as AppRole[] | undefined;
        if (tokenRoles && tokenRoles.length > 0) {
          // Roles are already present — stale flag, fix it without a DB round-trip
          token.needsRoleSelection = false;
        } else {
          try {
            const roles = await prisma.userRole.findMany({
              where: { userId: token.sub },
            });
            if (roles.length > 0) {
              token.roles = roles.map((r) => r.role) as AppRole[];
              token.needsRoleSelection = false;
            }
          } catch {
            // Prisma not available in Edge — will re-sync on next Node.js request
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.roles = (token.roles as AppRole[]) ?? [];
      // Derive needsRoleSelection from roles array — resilient to stale JWT field
      session.user.needsRoleSelection = session.user.roles.length === 0;
      return session;
    },
  },
});
