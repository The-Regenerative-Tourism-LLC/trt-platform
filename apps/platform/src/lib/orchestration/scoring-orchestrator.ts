/**
 * Scoring Orchestrator
 *
 * The ONLY layer authorised to invoke the TRT Scoring Engine.
 *
 * Responsibilities (in order):
 *   1. Validate input data
 *   2. Build the AssessmentSnapshot
 *   3. Load the active DPI snapshot for the territory
 *   4. Load the active MethodologyBundle
 *   5. Invoke computeScore() — the engine
 *   6. Persist the resulting ScoreSnapshot (append-only)
 *   7. Return the persisted ScoreSnapshot
 *
 * This orchestrator must NOT be called from frontend components or pages.
 * It must ONLY be called from API routes.
 */

import { createHash } from "crypto";
import { computeScore } from "../engine/trt-scoring-engine";
import {
  buildAssessmentSnapshot,
  type AssessmentSnapshotInput,
} from "../snapshots/assessment-snapshot.builder";
import { loadActiveBundle } from "../methodology/methodology-bundle.loader";
import { findLatestDpiByTerritory } from "../db/repositories/dpi.repo";
import {
  createAssessmentSnapshot,
  findLatestAssessmentByOperator,
  findBaselineAssessment,
} from "../db/repositories/assessment.repo";
import {
  createScoreSnapshot,
  findPublishedScoresByTerritory,
} from "../db/repositories/score.repo";
import { findEvidenceBySnapshot } from "../db/repositories/evidence.repo";
import { logAuditEvent } from "../audit/logger";
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
 * snapshot → engine → persist → return
 */
export async function runScoring(input: ScoringInput): Promise<ScoringResult> {
  const createdAt = new Date().toISOString();

  // ── Step 1: Build the immutable AssessmentSnapshot ─────────────────────
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

    // Delta
    deltaPriorCycle: assessmentSnapshot.delta?.priorCycle,
    deltaBaselineScores: assessmentSnapshot.delta?.baselineScores as any,
    deltaPriorScores: assessmentSnapshot.delta?.priorScores as any,
    deltaCurrentScores: assessmentSnapshot.delta?.currentScores as any,

    snapshotHash: assessmentSnapshot.snapshotHash,
  });

  // ── Step 3: Load active DPI snapshot for territory ─────────────────────
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

  // ── Step 4: Load active MethodologyBundle ──────────────────────────────
  const { bundle: methodology, hash: bundleHash } = await loadActiveBundle();

  // ── Step 5: Compute input hash for audit ──────────────────────────────
  const inputHash = createHash("sha256")
    .update(assessmentSnapshot.snapshotHash)
    .digest("hex");

  // ── Step 6: Invoke the TRT Scoring Engine ──────────────────────────────
  const engineResult = computeScore(assessmentSnapshot, dpiSnapshot, methodology);

  // ── Step 7: Determine publication eligibility ──────────────────────────
  const pendingEvidence = input.snapshotInput.evidence.filter(
    (e) => e.verificationState === "pending"
  );
  const hasT1Evidence = input.snapshotInput.evidence.some((e) => e.tier === "T1");
  let isPublished = true;
  let publicationBlockedReason: string | null = null;

  if (engineResult.gpsTotal < 40) {
    isPublished = false;
    publicationBlockedReason = "GPS below 40 — private assessment report";
  } else if (!hasT1Evidence && pendingEvidence.length === 0) {
    isPublished = false;
    publicationBlockedReason = "T1 evidence required";
  }

  // ── Step 8: Persist the ScoreSnapshot (append-only) ───────────────────
  const persistedScore = await createScoreSnapshot({
    assessmentSnapshot: { connect: { id: persistedAssessment.id } },
    operator: { connect: { id: input.operatorId } },
    ...(dpiRecord ? { dpiSnapshot: { connect: { id: dpiRecord.id } } } : {}),
    methodologyVersion: methodology.version,
    inputHash,
    bundleHash,
    p1Score: engineResult.p1Score,
    p2Score: engineResult.p2Score,
    p3Score: engineResult.p3Score,
    gpsTotal: engineResult.gpsTotal,
    gpsBand: engineResult.gpsBand as any,
    dpsTotal: engineResult.dpsTotal,
    dps1: engineResult.dps1,
    dps2: engineResult.dps2,
    dps3: engineResult.dps3,
    dpsBand: engineResult.dpsBand as any,
    dpiScore: engineResult.dpiScore,
    dpiPressureLevel: engineResult.dpiPressureLevel as any,
    computationTrace: engineResult.computationTrace as any,
    isPublished,
    publicationBlockedReason,
  });

  // ── Step 9: Audit log ──────────────────────────────────────────────────
  await logAuditEvent({
    actor: input.actorUserId,
    action: "score.computed",
    entityType: "ScoreSnapshot",
    entityId: persistedScore.id,
    payload: {
      assessmentSnapshotId: persistedAssessment.id,
      gpsTotal: engineResult.gpsTotal,
      gpsBand: engineResult.gpsBand,
      methodologyVersion: methodology.version,
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
