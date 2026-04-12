/**
 * POST /api/auth/signup
 *
 * Creates a new user with email/password, assigns a role,
 * and provisions the corresponding domain profile (Operator or Traveler).
 *
 * Auth is intentionally separated from onboarding / assessment data.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createToken } from "@/lib/tokens";
import { sendVerifyEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z.enum(["operator", "traveler"]),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role, marketingOptIn } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let newUserId: string;

    const consentedAt = marketingOptIn === true ? new Date() : undefined;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          marketingEmailConsent: marketingOptIn === true,
          consentedAt,
        },
      });
      newUserId = user.id;

      await tx.userRole.create({
        data: { userId: user.id, role },
      });

      if (role === "operator") {
        await tx.operator.create({
          data: {
            userId: user.id,
            legalName: name,
            photos: [],
            amenities: [],
          },
        });
      } else {
        await tx.traveler.create({
          data: {
            userId: user.id,
            displayName: name,
          },
        });
      }
    });

    // Send verification email only — welcome email and Klaviyo subscription
    // are triggered after the user clicks the verification link.
    void (async () => {
      try {
        const { rawToken } = await createToken({
          type: "email_verification",
          email,
          userId: newUserId!,
        });

        const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`;

        await sendVerifyEmail({
          to: email,
          userId: newUserId!,
          recipientName: name,
          verifyUrl,
          expiresInHours: 24,
        });
      } catch (emailErr) {
        // Email failure must never affect account creation
        console.error("[signup] Verification email dispatch failed:", emailErr);
      }
    })();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/signup]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
