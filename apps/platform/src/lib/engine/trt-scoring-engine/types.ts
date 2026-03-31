/**
 * TRT Scoring Engine — Type Definitions
 *
 * These types define the exact public contract of the scoring engine.
 * All inputs must be fully provided before invoking computeScore().
 * The engine never reads from the database, environment, or system time.
 */

// ── Methodology Bundle ─────────────────────────────────────────────────────

export interface NormBounds {
  readonly b100: number;
  readonly b75: number;
  readonly b50: number;
  readonly b25: number;
  readonly dir: "lower_is_better" | "higher_is_better";
}

export type IndicatorId = string;

export interface MethodologyBundle {
  readonly version: string;
  readonly publishedAt: string; // ISO8601
  readonly pillarWeights: {
    readonly p1: number; // 0.40
    readonly p2: number; // 0.30
    readonly p3: number; // 0.30
  };
  readonly p1SubWeights: {
    readonly energy: number; // 0.30
    readonly water: number; // 0.25
    readonly waste: number; // 0.20
    readonly carbon: number; // 0.15
    readonly site: number; // 0.10
  };
  readonly p2SubWeights: {
    readonly employment: number; // 0.35
    readonly procurement: number; // 0.30
    readonly revenueRetention: number; // 0.20
    readonly community: number; // 0.15
  };
  readonly p3SubWeights: {
    readonly categoryScope: number; // 0.40
    readonly traceability: number; // 0.30
    readonly additionality: number; // 0.20
    readonly continuity: number; // 0.10
  };
  readonly p1CompositeWeights: {
    readonly energyIntensityIn1a: number; // 0.60
    readonly renewablePctIn1a: number; // 0.40
    readonly localEmploymentRateIn2a: number; // 0.60
    readonly employmentQualityIn2a: number; // 0.40
  };
  readonly dpsConfig: {
    readonly dps1Min: number; // -10
    readonly dps1Max: number; // 10
    readonly dps2Multiplier: number; // 10
    readonly dps3Bonus: number; // 5
    readonly dps3Threshold: number; // 10
  };
  readonly bandThresholds: {
    readonly regenerativeLeader: number; // 85
    readonly regenerativePractice: number; // 70
    readonly advancing: number; // 55
    readonly developing: number; // 40
  };
  readonly normalizationBounds: Record<IndicatorId, NormBounds>;
  readonly normalizationBoundsTours?: Record<IndicatorId, NormBounds>;
  readonly signature?: string;
}

// ── Snapshot Inputs ────────────────────────────────────────────────────────

export interface P1Responses {
  readonly energyIntensity: number | null;
  readonly renewablePct: number | null;
  readonly waterIntensity: number | null;
  readonly recirculationScore: number | null; // 0-3 discrete
  readonly wasteDiversionPct: number | null;
  readonly carbonIntensity: number | null;
  readonly siteScore: number | null; // 0-4 discrete
}

export interface P2Responses {
  readonly localEmploymentRate: number | null;
  readonly employmentQuality: number | null; // 0-100
  readonly localFbRate: number | null;
  readonly localNonfbRate: number | null;
  readonly directBookingRate: number | null;
  readonly localOwnershipPct: number | null;
  readonly communityScore: number | null; // 0-4 discrete
}

export interface P3Responses {
  readonly categoryScope: number | null; // pre-normalised 0-100
  readonly traceability: number | null; // 0 | 25 | 50 | 75 | 100
  readonly additionality: number | null; // 0 | 25 | 50 | 75 | 100
  readonly continuity: number | null; // 0 | 25 | 50 | 75 | 100
}

export interface DeltaBlock {
  readonly priorCycle: number;
  readonly baselineScores: Record<IndicatorId, number>;
  readonly priorScores: Record<IndicatorId, number>;
  readonly currentScores: Record<IndicatorId, number>;
}

export interface EvidenceRef {
  readonly indicatorId: string;
  readonly tier: "T1" | "T2" | "T3" | "Proxy";
  readonly checksum?: string;
  readonly verificationState?: "pending" | "verified" | "rejected" | "lapsed";
  readonly proxyMethod?: string;
  readonly proxyCorrectionFactor?: number;
}

export interface AssessmentSnapshot {
  readonly operatorId: string;
  readonly operatorType: "A" | "B" | "C";
  readonly activityUnit: {
    readonly guestNights?: number;
    readonly visitorDays?: number;
  };
  readonly revenueSplit?: {
    readonly accommodationPct?: number;
    readonly experiencePct?: number;
  };
  readonly assessmentCycle: number; // 1 = baseline
  readonly assessmentPeriodEnd: string; // ISO8601 date

  readonly pillar1: P1Responses;
  /**
   * Type C only: experience-side P1 indicators derived using visitor_days as AoU.
   * When present, the engine computes two separate P1 scores (acc + exp) and blends
   * them by revenue split. pillar1 is the accommodation-side (guest_nights AoU).
   */
  readonly pillar1Exp?: P1Responses;
  readonly pillar2: P2Responses;
  readonly pillar3: P3Responses;
  readonly p3Status: "A" | "B" | "C" | "D" | "E";

  readonly delta: DeltaBlock | null; // null on Cycle 1

  readonly evidence: EvidenceRef[];

  readonly snapshotHash: string; // SHA-256 of canonical JSON
  readonly createdAt: string; // ISO8601 timestamp
}

export interface DpiSnapshot {
  readonly territoryId: string;
  readonly touristIntensity: number; // weight 35%
  readonly ecologicalSensitivity: number; // weight 30%
  readonly economicLeakageRate: number; // weight 20%
  readonly regenerativePerf: number; // weight 15%
  readonly compositeDpi: number;
  readonly pressureLevel: "low" | "moderate" | "high";
  readonly snapshotHash: string;
  readonly createdAt: string; // ISO8601 timestamp
}

// ── Engine Outputs ─────────────────────────────────────────────────────────

export type GreenPassportBand =
  | "regenerative_leader"
  | "regenerative_practice"
  | "advancing"
  | "developing"
  | "not_yet_published";

export type DpsBand =
  | "accelerating"
  | "progressing"
  | "stable"
  | "regressing"
  | "critical";

export type DpiPressureLevel = "low" | "moderate" | "high";

export interface ComputationTrace {
  readonly p1SubScores: Record<string, number>;
  readonly p2SubScores: Record<string, number>;
  readonly p3SubScores: Record<string, number>;
  readonly p1Weighted: number;
  readonly p2Weighted: number;
  readonly p3Weighted: number;
  readonly gpsBase: number;
  readonly dpsComponents?: {
    readonly dps1: number;
    readonly dps2: number;
    readonly dps3: number;
  };
  /** Type C only: accommodation-side (guest_nights AoU) P1 sub-scores before blending */
  readonly p1AccSubScores?: Record<string, number>;
  /** Type C only: experience-side (visitor_days AoU) P1 sub-scores before blending */
  readonly p1ExpSubScores?: Record<string, number>;
  /** True when GPS was renormalized using P1+P2 only (Status D) */
  readonly statusDRenormalized?: boolean;
}

export interface ScoreSnapshot {
  readonly assessmentSnapshotId: string;
  readonly methodologyVersion: string;

  // GPS result
  readonly gpsTotal: number; // 0-100 clamped
  readonly gpsBand: GreenPassportBand;
  readonly p1Score: number;
  readonly p2Score: number;
  readonly p3Score: number;

  // Directional Change
  readonly dpsTotal: number | null; // null on Cycle 1
  readonly dps1: number | null;
  readonly dps2: number | null;
  readonly dps3: number | null;
  readonly dpsBand: DpsBand | null;

  // DPI context
  readonly dpiScore: number;
  readonly dpiPressureLevel: DpiPressureLevel;

  // Audit
  readonly computationTrace: ComputationTrace;
  readonly inputHash: string; // hash of AssessmentSnapshot
  readonly methodologyHash: string; // hash of MethodologyBundle
  readonly createdAt: string; // ISO8601 timestamp
}
