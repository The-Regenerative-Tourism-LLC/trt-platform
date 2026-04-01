/**
 * POST /api/account/change-password
 *
 * Authenticated endpoint — changes the current user's password.
 *
 * Security requirements:
 *  1. Current password is verified before accepting the new one.
 *  2. New password must differ from the current one (enforced client-side too).
 *  3. A "password changed" confirmation email is dispatched.
 *  4. JWT-based sessions: existing tokens remain valid until expiry.
 *     True session invalidation requires a server-side revocation list
 *     (future: add passwordChangedAt to User and check in middleware).
 *
 * Only works for credentials users (passwordHash present).
 * OAuth-only users should manage passwords through their provider.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { sendPasswordChangedEmail } from "@/lib/email";

const Schema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // OAuth-only users have no password hash
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Your account uses Google sign-in. Password cannot be changed here.",
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCorrect) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Prevent no-op change
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Security confirmation email — fire and forget
    void sendPasswordChangedEmail({
      to: user.email,
      userId: user.id,
      recipientName: user.name ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("Unauthorized") || msg.includes("requireSession")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/account/change-password]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
