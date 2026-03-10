import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // Phase 2: Replace with proper user auth table
    // For MVP: simplified credential check
    const { email, password } = parsed.data;

    const userRole = await prisma.userRole.findFirst({
      where: {
        // In MVP without a users table, we'll use a placeholder check
        // This should be replaced with proper password hashing against a users table
      } as any,
    });

    // Placeholder — replace with actual user lookup and bcrypt.compare
    if (!email || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // TODO: Implement full auth with password table in Phase 2
    return NextResponse.json(
      { error: "Auth not fully implemented — use onboarding flow" },
      { status: 501 }
    );
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
