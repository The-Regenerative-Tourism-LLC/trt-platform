/**
 * GET  /api/v1/onboarding/draft
 * POST /api/v1/onboarding/draft
 *
 * Onboarding draft persistence for operators.
 * One mutable draft per operator — no scoring logic involved.
 *
 * GET  — Returns the current draft (currentStep + dataJson) or an empty draft.
 * POST — Upserts the draft with the provided currentStep and dataJson.
 *
 * Authentication: operator session required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import {
  findDraftByOperatorId,
  upsertDraft,
} from "@/lib/db/repositories/onboarding-draft.repo";
import { z } from "zod";

const SaveDraftSchema = z.object({
  currentStep: z.number().int().min(0),
  dataJson: z.record(z.unknown()),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Operator profile not found" }, { status: 404 });
    }

    const draft = await findDraftByOperatorId(operator.id);

    if (!draft) {
      return NextResponse.json({
        draft: {
          currentStep: 0,
          dataJson: {},
          updatedAt: null,
        },
      });
    }

    return NextResponse.json({
      draft: {
        currentStep: draft.currentStep,
        dataJson: draft.dataJson,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/onboarding/draft]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = SaveDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Operator profile not found" }, { status: 404 });
    }

    const draft = await upsertDraft(
      operator.id,
      parsed.data.currentStep,
      parsed.data.dataJson
    );

    return NextResponse.json({
      success: true,
      draft: {
        currentStep: draft.currentStep,
        dataJson: draft.dataJson,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/onboarding/draft]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
