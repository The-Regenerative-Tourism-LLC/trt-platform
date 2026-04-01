/**
 * POST /api/auth/resend-verification
 *
 * Re-sends an email verification link.
 *
 * Rate limit: 1 email per 60 seconds per address.
 * The check is done against EmailLog so it works whether the user is
 * authenticated or not (both paths share the same table).
 *
 * The endpoint accepts:
 *   - Authenticated request: email is read from the JWT session.
 *   - Unauthenticated request: email must be provided in the request body.
 *     (Covers the "link clicked on a different device" scenario.)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createToken } from "@/lib/tokens";
import { sendVerifyEmail } from "@/lib/email";

const RATE_LIMIT_SECONDS = 60;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

const BodySchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Resolve the target email — from session or request body
    const session = await auth();
    let email: string | null = session?.user?.email ?? null;

    if (!email) {
      const body = await req.json().catch(() => ({}));
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success || !parsed.data.email) {
        return NextResponse.json(
          { error: "Email address is required." },
          { status: 400 }
        );
      }
      email = parsed.data.email;
    }

    // Look up the user — silently succeed if not found (prevent enumeration)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    if (!user) {
      // Respond identically to the success case
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      // Already verified — inform the caller so the UI can redirect
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // ── Rate limit ──────────────────────────────────────────────────────────
    const windowStart = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000);
    const recentSend = await prisma.emailLog.findFirst({
      where: {
        email,
        type: "email_verification",
        createdAt: { gt: windowStart },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentSend) {
      const retryAfterMs =
        recentSend.createdAt.getTime() +
        RATE_LIMIT_SECONDS * 1000 -
        Date.now();
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      return NextResponse.json(
        {
          error: `Please wait ${retryAfterSec} second${retryAfterSec !== 1 ? "s" : ""} before requesting another verification email.`,
          retryAfterSeconds: retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    // ── Generate token and send ─────────────────────────────────────────────
    const { rawToken } = await createToken({
      type: "email_verification",
      email,
      userId: user.id,
    });

    const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`;

    await sendVerifyEmail({
      to: email,
      userId: user.id,
      recipientName: user.name ?? undefined,
      verifyUrl,
      expiresInHours: 24,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/resend-verification]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
