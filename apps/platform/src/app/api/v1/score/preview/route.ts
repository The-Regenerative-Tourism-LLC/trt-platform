/**
 * POST /api/v1/score/preview
 *
 * Returns preview scores computed from raw onboarding inputs.
 * Calls computeP1Intensities(), computeP2Rates(), builds a temporary
 * AssessmentSnapshot (in-memory only), and invokes the scoring engine.
 *
 * GUARANTEES:
 *   - Nothing is persisted to the database
 *   - No AssessmentSnapshot row is created
 *   - No ScoreSnapshot row is created
 *   - The snapshot hash is computed but never stored
 *
 * Authentication: operator session required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { computeP1Intensities, type RawP1Inputs } from "@/lib/computation/p1-derive";
import { computeP2Rates, type RawP2Inputs } from "@/lib/computation/p2-derive";
import { buildAssessmentSnapshot } from "@/lib/snapshots/assessment-snapshot.builder";
import { computeScore } from "@/lib/engine/trt-scoring-engine";
import { loadActiveBundle } from "@/lib/methodology/methodology-bundle.loader";
import { findLatestDpiByTerritory } from "@/lib/db/repositories/dpi.repo";
import type { DpiSnapshot } from "@/lib/engine/trt-scoring-engine/types";
import { computeCategoryScope } from "@/lib/constants";
import { z } from "zod";

// ── Validation schema ─────────────────────────────────────────────────────────

const RawP1Schema = z.object({
  operatorType: z.enum(["A", "B", "C"]),
  guestNights: z.number().nonnegative().optional(),
  visitorDays: z.number().nonnegative().optional(),
  revenueSplitAccommodationPct: z.number().min(0).max(100).optional(),
  revenueSplitExperiencePct: z.number().min(0).max(100).optional(),
  totalElectricityKwh: z.number().nonnegative().optional(),
  totalGasKwh: z.number().nonnegative().optional(),
  gridExportKwh: z.number().nonnegative().optional(),
  officeElectricityKwh: z.number().nonnegative().optional(),
  tourNoTransport: z.boolean().optional(),
  tourNoFixedBase: z.boolean().optional(),
  tourFuelType: z.string().optional(),
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
  siteScore: z.number().min(0).max(4).optional(),
});

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
  seasonalOperator: z.boolean().optional(),
  totalBookingsCount: z.number().int().nonnegative().optional(),
  allDirectBookings: z.boolean().optional(),
});

const P3Schema = z.object({
  categoryScope: z.number().min(0).max(100).nullable().optional(),
  contributionCategories: z.array(z.string()).optional(),
  traceability: z.number().nullable(),
  additionality: z.number().nullable(),
  continuity: z.number().nullable(),
});

const PreviewRequestSchema = z.object({
  operatorType: z.enum(["A", "B", "C"]),
  territoryId: z.string().min(1).optional(),
  assessmentPeriodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  activityUnit: z
    .object({
      guestNights: z.number().nonnegative().optional(),
      visitorDays: z.number().nonnegative().optional(),
    })
    .optional(),
  revenueSplit: z
    .object({
      accommodationPct: z.number().min(0).max(100).optional(),
      experiencePct: z.number().min(0).max(100).optional(),
    })
    .optional(),
  p1Raw: RawP1Schema,
  p2Raw: RawP2Schema,
  p3: P3Schema,
  p3Status: z.enum(["A", "B", "C", "D", "E"]),
  recirculationScore: z.number().int().min(0).max(3).nullable().optional(),
});

// ── Fallback DPI when no territory data available ─────────────────────────────

const FALLBACK_DPI: DpiSnapshot = {
  territoryId: "unknown",
  touristIntensity: 50,
  ecologicalSensitivity: 50,
  economicLeakageRate: 40,
  regenerativePerf: 0,
  compositeDpi: 50,
  pressureLevel: "moderate",
  snapshotHash: "fallback",
  createdAt: new Date(0).toISOString(),
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = PreviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // ── Derive P1 indicators from raw inputs ────────────────────────────────
    const p1Raw: RawP1Inputs = {
      ...d.p1Raw,
      operatorType: d.operatorType,
      guestNights: d.activityUnit?.guestNights ?? d.p1Raw.guestNights,
      visitorDays: d.activityUnit?.visitorDays ?? d.p1Raw.visitorDays,
      revenueSplitAccommodationPct:
        d.revenueSplit?.accommodationPct ?? d.p1Raw.revenueSplitAccommodationPct,
      revenueSplitExperiencePct:
        d.revenueSplit?.experiencePct ?? d.p1Raw.revenueSplitExperiencePct,
    };

    const derivedP1 = computeP1Intensities(p1Raw);

    // ── Derive P2 rates from raw inputs ─────────────────────────────────────
    const derivedP2 = computeP2Rates(d.p2Raw as RawP2Inputs);

    // ── Build temporary in-memory AssessmentSnapshot (NOT persisted) ────────
    const now = new Date().toISOString();
    const snapshot = buildAssessmentSnapshot(
      {
        operatorId: session.userId, // preview: use userId as placeholder — never stored
        operatorType: d.operatorType,
        activityUnit: d.activityUnit ?? {},
        revenueSplit: d.revenueSplit,
        assessmentCycle: 1, // preview always treated as Cycle 1 (no DPS)
        assessmentPeriodEnd: d.assessmentPeriodEnd ?? new Date().toISOString().slice(0, 10),
        pillar1: {
          energyIntensity: derivedP1.energyIntensity,
          renewablePct: derivedP1.renewablePct,
          waterIntensity: derivedP1.waterIntensity,
          recirculationScore: d.recirculationScore ?? null,
          wasteDiversionPct: derivedP1.wasteDiversionPct,
          carbonIntensity: derivedP1.carbonIntensity,
          siteScore: derivedP1.siteScore,
        },
        pillar2: {
          localEmploymentRate: derivedP2.localEmploymentRate,
          employmentQuality: derivedP2.employmentQuality,
          localFbRate: derivedP2.localFbRate,
          localNonfbRate: derivedP2.localNonFbRate,
          directBookingRate: derivedP2.directBookingRate,
          localOwnershipPct: derivedP2.localOwnershipPct,
          communityScore: derivedP2.communityScore,
        },
        pillar3: {
          categoryScope:
            d.p3.categoryScope ??
            (d.p3.contributionCategories && d.p3.contributionCategories.length > 0
              ? computeCategoryScope(d.p3.contributionCategories)
              : null),
          traceability: d.p3.traceability,
          additionality: d.p3.additionality,
          continuity: d.p3.continuity,
        },
        p3Status: d.p3Status,
        delta: null,
        evidence: [],
      },
      now
    );

    // ── Load DPI (territory-specific or fallback) ────────────────────────────
    let dpi: DpiSnapshot = FALLBACK_DPI;
    if (d.territoryId) {
      const dbDpi = await findLatestDpiByTerritory(d.territoryId);
      if (dbDpi) {
        dpi = {
          territoryId: dbDpi.territoryId,
          touristIntensity: Number(dbDpi.touristIntensity),
          ecologicalSensitivity: Number(dbDpi.ecologicalSensitivity),
          economicLeakageRate: Number(dbDpi.economicLeakageRate),
          regenerativePerf: Number(dbDpi.regenerativePerf),
          compositeDpi: Number(dbDpi.compositeDpi),
          pressureLevel: dbDpi.pressureLevel as DpiSnapshot["pressureLevel"],
          snapshotHash: dbDpi.snapshotHash ?? "unknown",
          createdAt: dbDpi.createdAt.toISOString(),
        };
      }
    }

    // ── Load active methodology bundle ───────────────────────────────────────
    const { bundle } = await loadActiveBundle();

    // ── Invoke engine (pure computation, no DB writes) ───────────────────────
    const scores = computeScore(snapshot, dpi, bundle);

    // ── Return preview scores only ───────────────────────────────────────────
    return NextResponse.json({
      preview: true,
      pillar1Score: scores.p1Score,
      pillar2Score: scores.p2Score,
      pillar3Score: scores.p3Score,
      gpsScore: scores.gpsTotal,
      gpsBand: scores.gpsBand,
      indicatorScores: {
        p1: scores.computationTrace.p1SubScores,
        p2: scores.computationTrace.p2SubScores,
        p3: scores.computationTrace.p3SubScores,
      },
      derivedIndicators: {
        p1: derivedP1,
        p2: derivedP2,
      },
      methodologyVersion: scores.methodologyVersion,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/score/preview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
