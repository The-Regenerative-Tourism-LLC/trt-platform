/**
 * Session helpers — thin wrappers over Auth.js v5 `auth()`.
 *
 * These maintain backward-compatible signatures so existing API routes
 * (onboarding, scoring, dashboard) need no changes.
 */

import { auth } from "@/auth";
import type { AppRole } from "@prisma/client";

export interface SessionPayload {
  userId: string;
  email: string;
  role: AppRole;
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const primaryRole = session.user.roles?.[0] ?? null;
  if (!primaryRole) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    role: primaryRole,
  };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(role: AppRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role && session.role !== "admin") {
    throw new Error(`Forbidden: requires ${role} role`);
  }
  return session;
}
