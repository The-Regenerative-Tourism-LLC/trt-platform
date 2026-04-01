/**
 * POST /api/auth/reset-password
 *
 * Consumes a password reset token and updates the user's password.
 * Token is single-use and expires in 1 hour.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/tokens";
import { sendPasswordChangedEmail } from "@/lib/email";

const Schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const result = await verifyToken(token, "password_reset");

    if (!result.valid) {
      const messages = {
        not_found: "This reset link is invalid.",
        expired: "This reset link has expired. Please request a new one.",
        already_used: "This reset link has already been used.",
      };
      return NextResponse.json(
        { error: messages[result.reason] },
        { status: 400 }
      );
    }

    // Find user by email (from token) — never trust client-provided userId
    const user = await prisma.user.findUnique({
      where: { email: result.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Notify user that password was changed — security alert
    void sendPasswordChangedEmail({
      to: user.email,
      userId: user.id,
      recipientName: user.name ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
