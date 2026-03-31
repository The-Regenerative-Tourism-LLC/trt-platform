/**
 * POST /api/v1/score
 *
 * Orchestrates a full scoring run for an operator assessment.
 * This route validates, derives P1/P2 indicators from raw inputs,
 * then delegates to the orchestrator for persistence and engine invocation.
 *
 * SECURITY: Derived indicator values (intensities, rates) are NEVER
 * trusted from the client. Only raw onboarding data is accepted.
 * All derivation happens server-side via computeP1Intensities() and computeP2Rates().
 *
 * Authentication: operator role required.
 * The operator must own the target operatorId.
 */

import { NextRequest, NextResponse } from "next/server";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import { requireSession } from "@/lib/auth/session";
import {
  findOperatorByUserId,
  markOnboardingCompleted,
} from "@/lib/db/repositories/operator.repo";
import {
  computeP1Intensities,
  computeTypeCDualP1Intensities,
} from "@/lib/computation/p1-derive";
import { computeP2Rates } from "@/lib/computation/p2-derive";
import { z } from "zod";

// ── Raw P1 inputs (no derived values accepted from client) ────────────────────

const RawP1Schema = z.object({
  totalElectricityKwh: z.number().nonnegative().optional(),
  totalGasKwh: z.number().nonnegative().optional(),
  tourFuelType: z.enum(["diesel", "petrol", "electric"]).optional(),
  tourFuelLitresPerMonth: z.number().nonnegative().optional(),
  evKwhPerMonth: z.number().nonnegative().optional(),
  totalWaterLitres: z.number().nonnegative().optional(),
  totalWasteKg: z.number().nonnegative().optional(),
  wasteRecycledKg: z.number().nonnegative().optional(),
  wasteCompostedKg: z.number().nonnegative().optional(),
  wasteOtherDivertedKg: z.number().nonnegative().optional(),
  renewableOnsitePct: z.number().min(0).max(100).optional(),
  renewableTariffPct: z.number().min(0).max(100).optional(),
  scope3TransportKgCo2e: z.number().nonnegative().optional(),
  /** Discrete 0–3 rubric score — not derivable from raw data */
  recirculationScore: z.number().int().min(0).max(3).nullable(),
  /** Discrete 0–4 rubric score — not derivable from raw data */
  siteScore: z.number().int().min(0).max(4).nullable(),
});

// ── Raw P2 inputs (no derived values accepted from client) ────────────────────

const RawP2Schema = z.object({
  totalFte: z.number().nonnegative().optional(),
  localFte: z.number().nonnegative().optional(),
  permanentContractPct: z.number().min(0).max(100).optional(),
  averageMonthlyWage: z.number().nonnegative().optional(),
  minimumWage: z.number().nonnegative().optional(),
  totalFbSpend: z.number().nonnegative().optional(),
  localFbSpend: z.number().nonnegative().optional(),
  totalNonFbSpend: z.number().nonnegative().optional(),
  localNonFbSpend: z.number().nonnegative().optional(),
  directBookingPct: z.number().min(0).max(100).optional(),
  localOwnershipPct: z.number().min(0).max(100).optional(),
  communityScore: z.number().min(0).max(100).optional(),
  foodServiceType: z.string().optional(),
  tourNoFbSpend: z.boolean().optional(),
  tourNoNonFbSpend: z.boolean().optional(),
  soloOperator: z.boolean().optional(),
});

// ── Full request schema ───────────────────────────────────────────────────────

const ScoreRequestSchema = z.object({
  operatorId: z.string().min(1),
  territoryId: z.string().min(1),
  assessmentPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  operatorType: z.enum(["A", "B", "C"]),
  activityUnit: z.object({
    guestNights: z.number().nonnegative().optional(),
    visitorDays: z.number().nonnegative().optional(),
  }),
  revenueSplit: z
    .object({
      accommodationPct: z.number().min(0).max(100).optional(),
      experiencePct: z.number().min(0).max(100).optional(),
    })
    .optional(),
  p1Raw: RawP1Schema,
  p2Raw: RawP2Schema,
  pillar3: z.object({
    categoryScope: z.number().min(0).max(100).nullable(),
    traceability: z.number().nullable(),
    additionality: z.number().nullable(),
    continuity: z.number().nullable(),
  }),
  p3Status: z.enum(["A", "B", "C", "D", "E"]),
  // baselineScores, priorCycle, priorScores all computed server-side — never trusted from client
  delta: z
    .object({
      explanation: z.string().optional(),
    })
    .nullable(),
  evidence: z.array(
    z.object({
      indicatorId: z.string().min(1),
      // Accept both "Proxy" (internal enum) and "PROXY" (client-friendly alias)
      tier: z
        .enum(["T1", "T2", "T3", "Proxy", "PROXY"])
        .transform((t): "T1" | "T2" | "T3" | "Proxy" => (t === "PROXY" ? "Proxy" : t)),
      checksum: z.string().optional(),
      verificationState: z
        .enum(["pending", "verified", "rejected", "lapsed"])
        .optional()
        .default("pending"),
      proxyMethod: z.string().optional(),
      proxyCorrectionFactor: z.number().positive().optional(),
    })
  ).default([]),
  /** Required for Status D: forward commitment declaration fields */
  forwardCommitment: z
    .object({
      preferredCategory: z.string().optional(),
      territoryContext: z.string().optional(),
      preferredInstitutionType: z.string().optional(),
      targetActivationCycle: z.number().int().positive().optional(),
      authorisedSignatory: z.string().optional(),
      signedAt: z.string().optional(),
    })
    .optional(),
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

    // ── Derive P1 indicators server-side — client raw values only ────────
    // Type C: compute two separate indicator sets (acc = guest_nights AoU, exp = visitor_days AoU)
    const rawP1Base = {
      ...data.p1Raw,
      operatorType: data.operatorType,
      guestNights: data.activityUnit.guestNights,
      visitorDays: data.activityUnit.visitorDays,
      revenueSplitAccommodationPct: data.revenueSplit?.accommodationPct,
      revenueSplitExperiencePct: data.revenueSplit?.experiencePct,
      siteScore: data.p1Raw.siteScore ?? undefined,
    };

    let derivedP1Acc = computeP1Intensities(rawP1Base);
    let derivedP1Exp: typeof derivedP1Acc | undefined;

    if (data.operatorType === "C") {
      const dual = computeTypeCDualP1Intensities(rawP1Base);
      derivedP1Acc = dual.acc;
      derivedP1Exp = dual.exp;
    }

    // ── Derive P2 rates server-side — client raw values only ─────────────
    const derivedP2 = computeP2Rates(data.p2Raw);

    // ── Delegate to orchestrator ─────────────────────────────────────────
    const result = await runScoring({
      operatorId: data.operatorId,
      territoryId: data.territoryId,
      actorUserId: session.userId,
      forwardCommitment: data.forwardCommitment,
      snapshotInput: {
        operatorId: data.operatorId,
        operatorType: data.operatorType,
        activityUnit: data.activityUnit,
        revenueSplit: data.revenueSplit,
        assessmentCycle: (operator.assessmentCycleCount ?? 0) + 1,
        assessmentPeriodEnd: data.assessmentPeriodEnd,
        pillar1: {
          energyIntensity: derivedP1Acc.energyIntensity,
          renewablePct: derivedP1Acc.renewablePct,
          waterIntensity: derivedP1Acc.waterIntensity,
          recirculationScore: data.p1Raw.recirculationScore,
          wasteDiversionPct: derivedP1Acc.wasteDiversionPct,
          carbonIntensity: derivedP1Acc.carbonIntensity,
          siteScore: data.p1Raw.siteScore,
        },
        ...(derivedP1Exp
          ? {
              pillar1Exp: {
                energyIntensity: derivedP1Exp.energyIntensity,
                renewablePct: derivedP1Exp.renewablePct,
                waterIntensity: derivedP1Exp.waterIntensity,
                recirculationScore: data.p1Raw.recirculationScore,
                wasteDiversionPct: derivedP1Exp.wasteDiversionPct,
                carbonIntensity: derivedP1Exp.carbonIntensity,
                siteScore: data.p1Raw.siteScore,
              },
            }
          : {}),
        pillar2: {
          localEmploymentRate: derivedP2.localEmploymentRate,
          employmentQuality: derivedP2.employmentQuality,
          localFbRate: derivedP2.localFbRate,
          localNonfbRate: derivedP2.localNonFbRate,
          directBookingRate: derivedP2.directBookingRate,
          localOwnershipPct: derivedP2.localOwnershipPct,
          communityScore: derivedP2.communityScore,
        },
        pillar3: data.pillar3,
        p3Status: data.p3Status,
        delta: data.delta ? { explanation: data.delta.explanation } : null,
        evidence: data.evidence,
      },
    });

    // Mark onboarding as completed so the operator cannot re-enter the onboarding flow
    await markOnboardingCompleted(data.operatorId);

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
