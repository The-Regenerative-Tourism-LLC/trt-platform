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
    async jwt({ token, user, account, trigger }) {
      // On first sign-in, embed roles and emailVerified into the token.
      // Single query covers both to minimise DB round-trips.
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            emailVerified: true,
            roles: { select: { role: true } },
          },
        });
        token.roles = (dbUser?.roles.map((r) => r.role) ?? []) as AppRole[];
        token.needsRoleSelection = token.roles.length === 0;

        // Google guarantees the email is verified. Ensure the DB reflects this
        // so that the middleware never sends a Google user to /verify-email.
        // This also handles the case where an existing credentials account is
        // linked to Google — the adapter won't backfill emailVerified on link.
        if (account?.provider === "google" && !dbUser?.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        token.isEmailVerified =
          account?.provider === "google" ? true : !!dbUser?.emailVerified;
      }

      // On explicit session update (e.g. after role selection or email
      // verification), re-fetch both roles and emailVerified.
      if (trigger === "update") {
        const userId = token.sub!;
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            emailVerified: true,
            roles: { select: { role: true } },
          },
        });
        token.roles = (dbUser?.roles.map((r) => r.role) ?? []) as AppRole[];
        token.needsRoleSelection = token.roles.length === 0;
        token.isEmailVerified = !!dbUser?.emailVerified;
      }

      // Self-heal: JWT may carry stale isEmailVerified=false if the user
      // verified in another tab/session after the JWT was issued. Re-check
      // the DB so the middleware doesn't redirect a verified user to /verify-email.
      // Wrapped in try/catch — Prisma is not available in Edge runtime contexts.
      if (
        token.isEmailVerified === false &&
        token.sub &&
        !user &&
        trigger !== "update"
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { emailVerified: true },
          });
          if (dbUser?.emailVerified) {
            token.isEmailVerified = true;
          }
        } catch {
          // Prisma not available in Edge — will re-sync on next Node.js request
        }
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
      // Default true: existing JWTs that pre-date this field are unaffected on deploy.
      session.user.isEmailVerified = token.isEmailVerified ?? true;
      return session;
    },
  },
});
