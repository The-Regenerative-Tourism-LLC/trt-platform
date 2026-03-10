/**
 * Session Management
 *
 * JWT-based session tokens enforced in API Routes and middleware.
 * The scoring engine has no concept of identity — auth is purely a platform concern.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AppRole } from "@prisma/client";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "change-me-in-production-must-be-32-chars-min"
);

const COOKIE_NAME = "trt_session";
const SESSION_DURATION = "7d";

export interface SessionPayload {
  userId: string;
  email: string;
  role: AppRole;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(SESSION_SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(role: AppRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role && session.role !== "admin") {
    throw new Error(`Forbidden: requires ${role} role`);
  }
  return session;
}

export { COOKIE_NAME };
