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
import { findLatestDpiByTerritory, findMadeiraTerritoryId } from "../db/repositories/dpi.repo";
import {
  findCycle1ScoreByOperator,
  findLatestScoreByOperator,
} from "../db/repositories/score.repo";
import { logAuditEvent } from "../audit/logger";
import { validateTypeCRevenueSplit } from "../validation/assessment.schema";
import type { DpiSnapshot } from "../engine/trt-scoring-engine/types";
import { prisma } from "../db/prisma";

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

export interface ForwardCommitmentInput {
  preferredCategory?: string;
  territoryContext?: string;
  preferredInstitutionType?: string;
  targetActivationCycle?: number;
  authorisedSignatory?: string;
  signedAt?: string; // ISO date string
}

export interface ScoringInput {
  operatorId: string;
  territoryId: string;
  actorUserId: string;
  snapshotInput: AssessmentSnapshotInput;
  /** Required fields for ForwardCommitmentRecord when p3Status = "D" */
  forwardCommitment?: ForwardCommitmentInput;
  /**
   * Full raw submission payload captured at the moment of submission.
   * Written once to AssessmentSnapshot.rawSubmissionJson — immutable, never overwritten.
   * Guarantees zero data loss regardless of schema evolution.
   */
  rawSubmissionJson: Record<string, unknown>;
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
  /** Territory whose DPI was used (may be Madeira when operator territory has no DPI). */
  dpiTerritoryId: string;
  /** True when dpiTerritoryId ≠ input.territoryId (Madeira or FALLBACK used as reference). */
  referenceDpi: boolean;
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
  // delta is always null in the hash — full DeltaBlock is assembled from DB below.
  const assessmentSnapshot = buildAssessmentSnapshot(input.snapshotInput, createdAt);

  // ── Step 2: For Cycle 2+, lock baseline and prior scores from DB ────────
  // SECURITY: priorCycle, baselineScores, and priorScores are NEVER trusted from the client.
  // Both are loaded exclusively from persisted ScoreSnapshot records.
  let lockedDelta: ReturnType<typeof buildDeltaBlock> | null = null;

  if (assessmentSnapshot.assessmentCycle > 1) {
    const [cycle1Score, latestScore] = await Promise.all([
      findCycle1ScoreByOperator(input.operatorId),
      findLatestScoreByOperator(input.operatorId),
    ]);

    if (!cycle1Score) {
      throw new Error(
        `Cannot score Cycle ${assessmentSnapshot.assessmentCycle}: no Cycle 1 ScoreSnapshot found for operator ${input.operatorId}`
      );
    }

    const trace = cycle1Score.computationTrace as Record<string, unknown> | null;
    if (!trace) {
      throw new Error(
        "Cycle 1 ScoreSnapshot has no computationTrace — cannot lock baseline scores"
      );
    }

    const baselineScores: Record<string, number> = {
      ...(trace.p1SubScores as Record<string, number> ?? {}),
      ...(trace.p2SubScores as Record<string, number> ?? {}),
      p3: Number(cycle1Score.p3Score),
    };

    // Prior scores come from the most recent ScoreSnapshot, falling back to baseline
    let priorScores = baselineScores;
    if (latestScore) {
      const latestTrace = latestScore.computationTrace as Record<string, unknown> | null;
      if (latestTrace) {
        priorScores = {
          ...(latestTrace.p1SubScores as Record<string, number> ?? {}),
          ...(latestTrace.p2SubScores as Record<string, number> ?? {}),
          p3: Number(latestScore.p3Score),
        };
      }
    }

    lockedDelta = buildDeltaBlock({
      priorCycle: assessmentSnapshot.assessmentCycle - 1,
      baselineScores,
      priorScores,
    });
  }

  const lockedSnapshot = lockedDelta
    ? { ...assessmentSnapshot, delta: lockedDelta }
    : assessmentSnapshot;

  // ── Steps 3–4: Load DPI (reads only, before transaction) ──────────────
  // effectiveDpiRecord  — actual DB record used (for linking ScoreSnapshot.dpiSnapshotId)
  // referenceDpi        — true when operator territory ≠ DPI territory
  // dpiTerritoryId      — territory whose DPI was used (denormalised for analytics)
  const dpiRecord = await findLatestDpiByTerritory(input.territoryId);
  let effectiveDpiRecord = dpiRecord;
  let referenceDpi = false;
  let dpiSnapshot: DpiSnapshot;

  if (dpiRecord) {
    dpiSnapshot = {
      territoryId: dpiRecord.territoryId,
      touristIntensity: Number(dpiRecord.touristIntensity),
      ecologicalSensitivity: Number(dpiRecord.ecologicalSensitivity),
      economicLeakageRate: Number(dpiRecord.economicLeakageRate),
      regenerativePerf: Number(dpiRecord.regenerativePerf),
      compositeDpi: Number(dpiRecord.compositeDpi),
      pressureLevel: dpiRecord.pressureLevel,
      snapshotHash: dpiRecord.snapshotHash ?? "no-hash",
      createdAt: dpiRecord.createdAt.toISOString(),
    };
  } else {
    // No DPI for this territory — always reference DPI regardless of Madeira availability
    referenceDpi = true;
    const madeiraId = await findMadeiraTerritoryId();
    const madeiraDpi = madeiraId ? await findLatestDpiByTerritory(madeiraId) : null;
    effectiveDpiRecord = madeiraDpi;
    dpiSnapshot = madeiraDpi
      ? {
          territoryId: madeiraDpi.territoryId,
          touristIntensity: Number(madeiraDpi.touristIntensity),
          ecologicalSensitivity: Number(madeiraDpi.ecologicalSensitivity),
          economicLeakageRate: Number(madeiraDpi.economicLeakageRate),
          regenerativePerf: Number(madeiraDpi.regenerativePerf),
          compositeDpi: Number(madeiraDpi.compositeDpi),
          pressureLevel: madeiraDpi.pressureLevel,
          snapshotHash: madeiraDpi.snapshotHash ?? "no-hash",
          createdAt: madeiraDpi.createdAt.toISOString(),
        }
      : { ...FALLBACK_DPI, territoryId: input.territoryId };
  }

  // Territory whose DPI is being used — stored for analytics
  const dpiTerritoryId = dpiSnapshot.territoryId;

  // ── Step 5: Load active MethodologyBundle ──────────────────────────────
  const { bundle: methodology, hash: bundleHash } = await loadActiveBundle();

  // ── Step 6: Compute input hash for audit ──────────────────────────────
  const inputHash = createHash("sha256")
    .update(lockedSnapshot.snapshotHash)
    .digest("hex");

  // ── Step 7: Invoke the TRT Scoring Engine ──────────────────────────────
  const engineResult = computeScore(lockedSnapshot, dpiSnapshot, methodology);

  const p3Status = lockedSnapshot.p3Status;

  // ── Steps 8–12: Atomic persistence ────────────────────────────────────
  // All DB writes (snapshot, evidence, score, forward-commitment, cycle-count)
  // execute in a single interactive transaction so that a mid-flight failure
  // leaves no partial state. T3-gate and T1-coverage reads run inside the
  // transaction so they see the evidence refs written in the same transaction.
  const { persistedAssessment, persistedScore, finalP3Score, finalGpsTotal, isPublished, publicationBlockedReason } =
    await prisma.$transaction(async (tx) => {
      // Step 8: Persist AssessmentSnapshot (immutable, contains rawSubmissionJson)
      const persistedAssessment = await tx.assessmentSnapshot.create({
        data: {
          operator: { connect: { id: input.operatorId } },
          territory: { connect: { id: input.territoryId } },
          assessmentCycle: assessmentSnapshot.assessmentCycle,
          assessmentPeriodEnd: new Date(assessmentSnapshot.assessmentPeriodEnd),
          operatorType: assessmentSnapshot.operatorType as "A" | "B" | "C",
          guestNights: assessmentSnapshot.activityUnit.guestNights,
          visitorDays: assessmentSnapshot.activityUnit.visitorDays,
          revenueSplitAccommodationPct: assessmentSnapshot.revenueSplit?.accommodationPct,
          revenueSplitExperiencePct: assessmentSnapshot.revenueSplit?.experiencePct,
          p1EnergyIntensity: assessmentSnapshot.pillar1.energyIntensity,
          p1RenewablePct: assessmentSnapshot.pillar1.renewablePct,
          p1WaterIntensity: assessmentSnapshot.pillar1.waterIntensity,
          p1RecirculationScore: assessmentSnapshot.pillar1.recirculationScore,
          p1WasteDiversionPct: assessmentSnapshot.pillar1.wasteDiversionPct,
          p1CarbonIntensity: assessmentSnapshot.pillar1.carbonIntensity,
          p1SiteScore: assessmentSnapshot.pillar1.siteScore,
          p2LocalEmploymentRate: assessmentSnapshot.pillar2.localEmploymentRate,
          p2EmploymentQuality: assessmentSnapshot.pillar2.employmentQuality,
          p2LocalFbRate: assessmentSnapshot.pillar2.localFbRate,
          p2LocalNonfbRate: assessmentSnapshot.pillar2.localNonfbRate,
          p2DirectBookingRate: assessmentSnapshot.pillar2.directBookingRate,
          p2LocalOwnershipPct: assessmentSnapshot.pillar2.localOwnershipPct,
          p2CommunityScore: assessmentSnapshot.pillar2.communityScore,
          p3Status: assessmentSnapshot.p3Status as "A" | "B" | "C" | "D" | "E",
          p3CategoryScope: assessmentSnapshot.pillar3.categoryScope,
          p3Traceability: assessmentSnapshot.pillar3.traceability,
          p3Additionality: assessmentSnapshot.pillar3.additionality,
          p3Continuity: assessmentSnapshot.pillar3.continuity,
          deltaExplanation: input.snapshotInput.delta?.explanation,
          deltaPriorCycle: lockedDelta?.priorCycle,
          deltaBaselineScores: lockedDelta?.baselineScores as Record<string, number> | undefined,
          deltaPriorScores: lockedDelta?.priorScores as Record<string, number> | undefined,
          deltaCurrentScores: lockedDelta?.currentScores as Record<string, number> | undefined,
          snapshotHash: assessmentSnapshot.snapshotHash,
          rawSubmissionJson: input.rawSubmissionJson as import("@prisma/client").Prisma.InputJsonValue,
        },
      });

      // Step 8b: Persist evidence refs (append-only)
      if (input.snapshotInput.evidence.length > 0) {
        await Promise.all(
          input.snapshotInput.evidence.map((e) =>
            tx.evidenceRef.create({
              data: {
                assessmentSnapshot: { connect: { id: persistedAssessment.id } },
                operator: { connect: { id: input.operatorId } },
                indicatorId: e.indicatorId,
                tier: e.tier as "T1" | "T2" | "T3" | "Proxy",
                checksum: e.checksum,
                verificationState: (e.verificationState ?? "pending") as "pending" | "verified" | "rejected" | "lapsed",
                proxyMethod: e.proxyMethod,
                proxyCorrectionFactor: e.proxyCorrectionFactor,
              },
            })
          )
        );
      }

      // Step 9: T3 evidence gate (read within tx — sees refs just written above)
      let finalP3Score = engineResult.p3Score;
      let publicationBlockedReason: string | null = null;

      if (p3Status !== "D" && p3Status !== "E") {
        const t3Count = await tx.evidenceRef.count({
          where: { operatorId: input.operatorId, tier: "T3", verificationState: "verified" },
        });
        if (!t3Count) {
          finalP3Score = 0;
          publicationBlockedReason = "T3 evidence required for P3 scoring";
        }
      }

      // GPS recompute if P3 was zeroed by the T3 gate
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

      // Step 10: T1 coverage check (read within tx — sees refs just written above)
      let isPublished = false;
      if (!publicationBlockedReason) {
        const t1Evidence = await tx.evidenceRef.findMany({
          where: {
            assessmentSnapshotId: persistedAssessment.id,
            tier: "T1",
            verificationState: { notIn: ["rejected", "lapsed"] },
          },
          select: { indicatorId: true },
        });
        const t1Coverage = {
          p1: t1Evidence.some((e) => e.indicatorId.startsWith("p1_")),
          p2: t1Evidence.some((e) => e.indicatorId.startsWith("p2_")),
          p3: t1Evidence.some((e) => e.indicatorId.startsWith("p3_")),
        };
        if (t1Coverage.p1 && t1Coverage.p2 && t1Coverage.p3) {
          isPublished = true;
        } else {
          publicationBlockedReason = "Insufficient Tier 1 evidence coverage";
        }
      }

      // Step 11: Persist ScoreSnapshot
      const persistedScore = await tx.scoreSnapshot.create({
        data: {
          assessmentSnapshot: { connect: { id: persistedAssessment.id } },
          operator: { connect: { id: input.operatorId } },
          ...(effectiveDpiRecord ? { dpiSnapshot: { connect: { id: effectiveDpiRecord.id } } } : {}),
          dpiTerritoryId,
          referenceDpi,
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
          isPublished,
          publicationBlockedReason,
        },
      });

      // Step 12: ForwardCommitmentRecord for Status D
      if (p3Status === "D") {
        await tx.forwardCommitmentRecord.create({
          data: {
            operator: { connect: { id: input.operatorId } },
            assessmentCycle: lockedSnapshot.assessmentCycle,
            preferredCategory: input.forwardCommitment?.preferredCategory,
            territoryContext: input.forwardCommitment?.territoryContext ?? input.territoryId,
            preferredInstitutionType: input.forwardCommitment?.preferredInstitutionType,
            targetActivationCycle: input.forwardCommitment?.targetActivationCycle,
            authorisedSignatory: input.forwardCommitment?.authorisedSignatory,
            signedAt: input.forwardCommitment?.signedAt
              ? new Date(input.forwardCommitment.signedAt)
              : undefined,
          },
        });
      }

      // Step 13: Increment assessmentCycleCount
      await tx.operator.update({
        where: { id: input.operatorId },
        data: { assessmentCycleCount: { increment: 1 } },
      });

      return { persistedAssessment, persistedScore, finalP3Score, finalGpsTotal, isPublished, publicationBlockedReason };
    });

  // ── Step 14: Audit log (outside transaction — best-effort) ────────────
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
      isPublished,
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
    dpiTerritoryId: persistedScore.dpiTerritoryId ?? dpiTerritoryId,
    referenceDpi: persistedScore.referenceDpi,
    methodologyVersion: persistedScore.methodologyVersion,
    isPublished: persistedScore.isPublished,
    publicationBlockedReason: persistedScore.publicationBlockedReason,
  };
}
