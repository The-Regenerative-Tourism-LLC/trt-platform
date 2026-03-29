/**
 * POST /api/v1/score
 *
 * Orchestrates a full scoring run for an operator assessment.
 * This route validates, delegates to the orchestrator, and returns the result.
 * It does NOT compute scores itself — that is exclusively the engine's responsibility.
 *
 * Authentication: operator role required.
 * The operator must own the target operatorId.
 */

import { NextRequest, NextResponse } from "next/server";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import { AssessmentSnapshotSchema } from "@/lib/validation/assessment.schema";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { z } from "zod";

const ScoreRequestSchema = z.object({
  operatorId: z.string().min(1),
  territoryId: z.string().min(1),
  assessmentPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pillar1: z.object({
    energyIntensity: z.number().nullable(),
    renewablePct: z.number().nullable(),
    waterIntensity: z.number().nullable(),
    recirculationScore: z.number().int().min(0).max(3).nullable(),
    wasteDiversionPct: z.number().nullable(),
    carbonIntensity: z.number().nullable(),
    siteScore: z.number().int().min(0).max(4).nullable(),
  }),
  pillar2: z.object({
    localEmploymentRate: z.number().nullable(),
    employmentQuality: z.number().nullable(),
    localFbRate: z.number().nullable(),
    localNonfbRate: z.number().nullable(),
    directBookingRate: z.number().nullable(),
    localOwnershipPct: z.number().nullable(),
    communityScore: z.number().int().min(0).max(4).nullable(),
  }),
  pillar3: z.object({
    categoryScope: z.number().nullable(),
    traceability: z.number().nullable(),
    additionality: z.number().nullable(),
    continuity: z.number().nullable(),
  }),
  p3Status: z.enum(["A", "B", "C", "D", "E"]),
  operatorType: z.enum(["A", "B", "C"]),
  activityUnit: z.object({
    guestNights: z.number().optional(),
    visitorDays: z.number().optional(),
  }),
  revenueSplit: z.object({
    accommodationPct: z.number().optional(),
    experiencePct: z.number().optional(),
  }).optional(),
  // baselineScores intentionally excluded — loaded from DB by orchestrator
  delta: z.object({
    priorCycle: z.number().int().min(1),
    priorScores: z.record(z.number()),
  }).nullable(),
  evidence: z.array(z.object({
    indicatorId: z.string(),
    tier: z.enum(["T1", "T2", "T3", "Proxy"]),
    checksum: z.string(),
    verificationState: z.enum(["pending", "verified", "rejected", "lapsed"]),
  })),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth & RBAC ──────────────────────────────────────────────────────
    const session = await requireSession();

    const body = await req.json();
    const parsed = ScoreRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify the authenticated user owns the operator profile
    const operator = await findOperatorByUserId(session.userId);
    if (!operator || operator.id !== data.operatorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Delegate to orchestrator ─────────────────────────────────────────
    const result = await runScoring({
      operatorId: data.operatorId,
      territoryId: data.territoryId,
      actorUserId: session.userId,
      snapshotInput: {
        operatorId: data.operatorId,
        operatorType: data.operatorType,
        activityUnit: data.activityUnit,
        revenueSplit: data.revenueSplit,
        assessmentCycle: (operator.assessmentCycleCount ?? 0) + 1,
        assessmentPeriodEnd: data.assessmentPeriodEnd,
        pillar1: data.pillar1,
        pillar2: data.pillar2,
        pillar3: data.pillar3,
        p3Status: data.p3Status,
        delta: data.delta
          ? {
              priorCycle: data.delta.priorCycle,
              baselineScores: {}, // overwritten from DB by orchestrator
              priorScores: data.delta.priorScores,
              currentScores: {},
            }
          : null,
        evidence: data.evidence,
      },
    });

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[POST /api/v1/score]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
