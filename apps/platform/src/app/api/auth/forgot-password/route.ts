/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password reset flow.
 * Always responds with 200 — never reveals whether an account exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createToken } from "@/lib/tokens";
import { sendResetPasswordEmail } from "@/lib/email";

const Schema = z.object({
  email: z.string().email(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const { email } = parsed.data;

    // Look up user — silently continue if not found (prevents email enumeration)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true },
    });

    // Only send reset email if user exists and has a password
    // (OAuth-only users should use their provider to reset)
    if (user && user.passwordHash) {
      const { rawToken, expiresAt } = await createToken({
        type: "password_reset",
        email,
        userId: user.id,
      });

      const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;

      await sendResetPasswordEmail({
        to: email,
        userId: user.id,
        recipientName: user.name ?? undefined,
        resetUrl,
        expiresInMinutes: 60,
      });

      console.info(`[forgot-password] Reset email dispatched for user ${user.id}`);
    }

    // Always return success — prevents email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, you will receive a password reset link shortly.",
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
