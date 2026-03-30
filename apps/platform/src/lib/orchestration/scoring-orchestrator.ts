/**
 * Scoring Orchestrator
 *
 * The ONLY layer authorised to invoke the TRT Scoring Engine.
 *
 * Responsibilities (in order):
 *   1. Validate input data (including Type C revenue split)
 *   2. Build the AssessmentSnapshot
 *   3. Load Cycle 1 ScoreSnapshot from DB to lock baselineScores (Cycle 2+)
 *   4. Load the active DPI snapshot for the territory
 *   5. Load the active MethodologyBundle
 *   6. Invoke computeScore() — the engine
 *   7. Enforce T3 gate: zero out P3 score if no verified T3 evidence
 *   8. Persist the resulting ScoreSnapshot with isPublished = false (always)
 *   9. If p3Status = D, create a ForwardCommitmentRecord
 *  10. Increment operator assessmentCycleCount
 *  11. Audit log
 *
 * This orchestrator must NOT be called from frontend components or pages.
 * It must ONLY be called from API routes.
 */

import { createHash } from "crypto";
import { computeScore } from "../engine/trt-scoring-engine";
import {
  buildAssessmentSnapshot,
  buildDeltaBlock,
  type AssessmentSnapshotInput,
} from "../snapshots/assessment-snapshot.builder";
import { loadActiveBundle } from "../methodology/methodology-bundle.loader";
import { findLatestDpiByTerritory } from "../db/repositories/dpi.repo";
import { createAssessmentSnapshot } from "../db/repositories/assessment.repo";
import {
  createScoreSnapshot,
  findCycle1ScoreByOperator,
} from "../db/repositories/score.repo";
import {
  createEvidenceRef,
  findVerifiedT3Evidence,
} from "../db/repositories/evidence.repo";
import { incrementAssessmentCycle } from "../db/repositories/operator.repo";
import { createForwardCommitmentRecord } from "../db/repositories/forward-commitment.repo";
import { logAuditEvent } from "../audit/logger";
import { validateTypeCRevenueSplit } from "../validation/assessment.schema";
import type { DpiSnapshot } from "../engine/trt-scoring-engine/types";

// Default DPI snapshot when no territory-specific data is available
const FALLBACK_DPI: DpiSnapshot = {
  territoryId: "unknown",
  touristIntensity: 50,
  ecologicalSensitivity: 50,
  economicLeakageRate: 40,
  regenerativePerf: 0,
  compositeDpi: 50,
  pressureLevel: "moderate",
  snapshotHash: "fallback",
  createdAt: new Date().toISOString(),
};

export interface ScoringInput {
  operatorId: string;
  territoryId: string;
  actorUserId: string;
  snapshotInput: AssessmentSnapshotInput;
}

export interface ScoringResult {
  assessmentSnapshotId: string;
  scoreSnapshotId: string;
  gpsTotal: number;
  gpsBand: string;
  p1Score: number;
  p2Score: number;
  p3Score: number;
  dpsTotal: number | null;
  dps1: number | null;
  dps2: number | null;
  dps3: number | null;
  dpsBand: string | null;
  dpiScore: number;
  dpiPressureLevel: string;
  methodologyVersion: string;
  isPublished: boolean;
  publicationBlockedReason: string | null;
}

/**
 * Execute a full scoring run:
 * validate → snapshot → baseline lock → engine → T3 gate → persist → side-effects → return
 */
export async function runScoring(input: ScoringInput): Promise<ScoringResult> {
  const createdAt = new Date().toISOString();

  // ── Validate Type C revenue split ──────────────────────────────────────
  const revenueSplitError = validateTypeCRevenueSplit(
    input.snapshotInput.operatorType,
    input.snapshotInput.revenueSplit
  );
  if (revenueSplitError) {
    throw new Error(revenueSplitError);
  }

  // ── Step 1: Build the immutable AssessmentSnapshot ─────────────────────
  // For Cycle 2+, delta.baselineScores will be overwritten from DB below.
  const assessmentSnapshot = buildAssessmentSnapshot(input.snapshotInput, createdAt);

  // ── Step 2: Persist the AssessmentSnapshot ─────────────────────────────
  const persistedAssessment = await createAssessmentSnapshot({
    operator: { connect: { id: input.operatorId } },
    territory: { connect: { id: input.territoryId } },
    assessmentCycle: assessmentSnapshot.assessmentCycle,
    assessmentPeriodEnd: new Date(assessmentSnapshot.assessmentPeriodEnd),
    operatorType: assessmentSnapshot.operatorType as any,
    guestNights: assessmentSnapshot.activityUnit.guestNights,
    visitorDays: assessmentSnapshot.activityUnit.visitorDays,
    revenueSplitAccommodationPct: assessmentSnapshot.revenueSplit?.accommodationPct,
    revenueSplitExperiencePct: assessmentSnapshot.revenueSplit?.experiencePct,

    // Pillar 1
    p1EnergyIntensity: assessmentSnapshot.pillar1.energyIntensity,
    p1RenewablePct: assessmentSnapshot.pillar1.renewablePct,
    p1WaterIntensity: assessmentSnapshot.pillar1.waterIntensity,
    p1RecirculationScore: assessmentSnapshot.pillar1.recirculationScore,
    p1WasteDiversionPct: assessmentSnapshot.pillar1.wasteDiversionPct,
    p1CarbonIntensity: assessmentSnapshot.pillar1.carbonIntensity,
    p1SiteScore: assessmentSnapshot.pillar1.siteScore,

    // Pillar 2
    p2LocalEmploymentRate: assessmentSnapshot.pillar2.localEmploymentRate,
    p2EmploymentQuality: assessmentSnapshot.pillar2.employmentQuality,
    p2LocalFbRate: assessmentSnapshot.pillar2.localFbRate,
    p2LocalNonfbRate: assessmentSnapshot.pillar2.localNonfbRate,
    p2DirectBookingRate: assessmentSnapshot.pillar2.directBookingRate,
    p2LocalOwnershipPct: assessmentSnapshot.pillar2.localOwnershipPct,
    p2CommunityScore: assessmentSnapshot.pillar2.communityScore,

    // Pillar 3
    p3Status: assessmentSnapshot.p3Status as any,
    p3CategoryScope: assessmentSnapshot.pillar3.categoryScope,
    p3Traceability: assessmentSnapshot.pillar3.traceability,
    p3Additionality: assessmentSnapshot.pillar3.additionality,
    p3Continuity: assessmentSnapshot.pillar3.continuity,

    // Delta — will be DB-locked for Cycle 2+ below
    deltaPriorCycle: assessmentSnapshot.delta?.priorCycle,
    deltaBaselineScores: assessmentSnapshot.delta?.baselineScores as any,
    deltaPriorScores: assessmentSnapshot.delta?.priorScores as any,
    deltaCurrentScores: assessmentSnapshot.delta?.currentScores as any,

    snapshotHash: assessmentSnapshot.snapshotHash,
  });

  // ── Step 2b: Persist evidence refs (append-only, never updated) ────────
  if (input.snapshotInput.evidence.length > 0) {
    await Promise.all(
      input.snapshotInput.evidence.map((e) =>
        createEvidenceRef({
          assessmentSnapshot: { connect: { id: persistedAssessment.id } },
          operator: { connect: { id: input.operatorId } },
          indicatorId: e.indicatorId,
          tier: e.tier as any,
          checksum: e.checksum,
          verificationState: (e.verificationState ?? "pending") as any,
          proxyMethod: e.proxyMethod,
          proxyCorrectionFactor: e.proxyCorrectionFactor,
        })
      )
    );
  }

  // ── Step 3: Lock baselineScores from Cycle 1 ScoreSnapshot (Cycle 2+) ──
  // SECURITY: We never trust client-supplied baselineScores.
  // The authoritative baseline is always the persisted Cycle 1 ScoreSnapshot.
  let lockedSnapshot = assessmentSnapshot;

  if (assessmentSnapshot.assessmentCycle > 1) {
    const cycle1Score = await findCycle1ScoreByOperator(input.operatorId);
    if (!cycle1Score) {
      throw new Error(
        `Cannot score Cycle ${assessmentSnapshot.assessmentCycle}: no Cycle 1 ScoreSnapshot found for operator ${input.operatorId}`
      );
    }

    const trace = cycle1Score.computationTrace as Record<string, any> | null;
    if (!trace) {
      throw new Error(
        "Cycle 1 ScoreSnapshot has no computationTrace — cannot lock baseline scores"
      );
    }

    const baselineScores: Record<string, number> = {
      ...(trace.p1SubScores ?? {}),
      ...(trace.p2SubScores ?? {}),
      p3: Number(cycle1Score.p3Score),
    };

    const lockedDelta = buildDeltaBlock({
      priorCycle: 1,
      baselineScores,
      priorScores: assessmentSnapshot.delta?.priorScores ?? baselineScores,
    });

    lockedSnapshot = { ...assessmentSnapshot, delta: lockedDelta };
  }

  // ── Step 4: Load active DPI snapshot for territory ─────────────────────
  const dpiRecord = await findLatestDpiByTerritory(input.territoryId);
  const dpiSnapshot: DpiSnapshot = dpiRecord
    ? {
        territoryId: dpiRecord.territoryId,
        touristIntensity: Number(dpiRecord.touristIntensity),
        ecologicalSensitivity: Number(dpiRecord.ecologicalSensitivity),
        economicLeakageRate: Number(dpiRecord.economicLeakageRate),
        regenerativePerf: Number(dpiRecord.regenerativePerf),
        compositeDpi: Number(dpiRecord.compositeDpi),
        pressureLevel: dpiRecord.pressureLevel,
        snapshotHash: dpiRecord.snapshotHash ?? "no-hash",
        createdAt: dpiRecord.createdAt.toISOString(),
      }
    : { ...FALLBACK_DPI, territoryId: input.territoryId };

  // ── Step 5: Load active MethodologyBundle ──────────────────────────────
  const { bundle: methodology, hash: bundleHash } = await loadActiveBundle();

  // ── Step 6: Compute input hash for audit ──────────────────────────────
  const inputHash = createHash("sha256")
    .update(lockedSnapshot.snapshotHash)
    .digest("hex");

  // ── Step 7: Invoke the TRT Scoring Engine ──────────────────────────────
  const engineResult = computeScore(lockedSnapshot, dpiSnapshot, methodology);

  // ── Step 8: T3 evidence gate ───────────────────────────────────────────
  // If P3 status is A/B/C and no verified T3 evidence exists, P3 score = 0.
  // Status D and E already return score = 0 from the engine.
  let finalP3Score = engineResult.p3Score;
  let publicationBlockedReason: string | null = null;

  const p3Status = lockedSnapshot.p3Status;
  if (p3Status !== "D" && p3Status !== "E") {
    const hasVerifiedT3 = await findVerifiedT3Evidence(input.operatorId);
    if (!hasVerifiedT3) {
      finalP3Score = 0;
      publicationBlockedReason = "T3 evidence required for P3 scoring";
    }
  }

  // GPS total must be recomputed if P3 was zeroed by the T3 gate
  let finalGpsTotal = engineResult.gpsTotal;
  if (finalP3Score !== engineResult.p3Score) {
    const pw = methodology.pillarWeights;
    const gpsRaw =
      engineResult.p1Score * pw.p1 +
      engineResult.p2Score * pw.p2 +
      finalP3Score * pw.p3 +
      (engineResult.dpsTotal ?? 0);
    finalGpsTotal = Math.round(Math.max(0, Math.min(100, gpsRaw)));
  }

  // ── Step 9: ScoreSnapshot is ALWAYS created with isPublished = false ───
  // Publication requires explicit admin action after T1 evidence verification.
  if (!publicationBlockedReason) {
    publicationBlockedReason = "Pending T1 evidence verification";
  }

  const persistedScore = await createScoreSnapshot({
    assessmentSnapshot: { connect: { id: persistedAssessment.id } },
    operator: { connect: { id: input.operatorId } },
    ...(dpiRecord ? { dpiSnapshot: { connect: { id: dpiRecord.id } } } : {}),
    methodologyVersion: methodology.version,
    inputHash,
    bundleHash,
    p1Score: engineResult.p1Score,
    p2Score: engineResult.p2Score,
    p3Score: finalP3Score,
    gpsTotal: finalGpsTotal,
    gpsBand: engineResult.gpsBand as any,
    dpsTotal: engineResult.dpsTotal,
    dps1: engineResult.dps1,
    dps2: engineResult.dps2,
    dps3: engineResult.dps3,
    dpsBand: engineResult.dpsBand as any,
    dpiScore: engineResult.dpiScore,
    dpiPressureLevel: engineResult.dpiPressureLevel as any,
    computationTrace: engineResult.computationTrace as any,
    isPublished: false,
    publicationBlockedReason,
  });

  // ── Step 10: Create ForwardCommitmentRecord for Status D ───────────────
  if (p3Status === "D") {
    await createForwardCommitmentRecord({
      operatorId: input.operatorId,
      assessmentCycle: lockedSnapshot.assessmentCycle,
    });
  }

  // ── Step 11: Increment operator assessmentCycleCount ──────────────────
  await incrementAssessmentCycle(input.operatorId);

  // ── Step 12: Audit log ─────────────────────────────────────────────────
  await logAuditEvent({
    actor: input.actorUserId,
    action: "score.computed",
    entityType: "ScoreSnapshot",
    entityId: persistedScore.id,
    payload: {
      assessmentSnapshotId: persistedAssessment.id,
      gpsTotal: finalGpsTotal,
      gpsBand: engineResult.gpsBand,
      methodologyVersion: methodology.version,
      isPublished: false,
      publicationBlockedReason,
    },
  });

  return {
    assessmentSnapshotId: persistedAssessment.id,
    scoreSnapshotId: persistedScore.id,
    gpsTotal: Number(persistedScore.gpsTotal),
    gpsBand: persistedScore.gpsBand,
    p1Score: Number(persistedScore.p1Score),
    p2Score: Number(persistedScore.p2Score),
    p3Score: Number(persistedScore.p3Score),
    dpsTotal: persistedScore.dpsTotal ? Number(persistedScore.dpsTotal) : null,
    dps1: persistedScore.dps1 ? Number(persistedScore.dps1) : null,
    dps2: persistedScore.dps2 ? Number(persistedScore.dps2) : null,
    dps3: persistedScore.dps3 ? Number(persistedScore.dps3) : null,
    dpsBand: persistedScore.dpsBand,
    dpiScore: Number(persistedScore.dpiScore ?? 50),
    dpiPressureLevel: persistedScore.dpiPressureLevel ?? "moderate",
    methodologyVersion: persistedScore.methodologyVersion,
    isPublished: persistedScore.isPublished,
    publicationBlockedReason: persistedScore.publicationBlockedReason,
  };
}
