/**
 * Pillar 2 Derivation Module
 *
 * Pure computation — no side effects, no DB access, no imports from outside this module.
 * This is the ONLY location where raw P2 inputs are converted to derived indicator values.
 * TDD §7: derivation must happen server-side, never in frontend components or hooks.
 */

export interface RawP2Inputs {
  totalFte?: number;
  localFte?: number;
  permanentContractPct?: number;
  /** Average monthly wage in local currency */
  averageMonthlyWage?: number;
  /** Statutory minimum monthly wage in local currency */
  minimumWage?: number;
  totalFbSpend?: number;
  localFbSpend?: number;
  totalNonFbSpend?: number;
  localNonFbSpend?: number;
  /** 0–100 */
  directBookingPct?: number;
  /** 0–100 */
  localOwnershipPct?: number;
  /** 0–100 */
  communityScore?: number;
  foodServiceType?: string;
  /** If true, operator runs no F&B — local F&B rate = 100 */
  tourNoFbSpend?: boolean;
  /** If true, operator runs no non-F&B procurement — local non-F&B rate = 100 */
  tourNoNonFbSpend?: boolean;
  /** If true, solo/owner-operator — employment metrics default to 100 */
  soloOperator?: boolean;
  /** Seasonal operation — raw flag for audit context */
  seasonalOperator?: boolean;
  /** Total bookings in assessment period — raw context */
  totalBookingsCount?: number;
  /** All bookings via direct channels */
  allDirectBookings?: boolean;
}

export interface DerivedP2Indicators {
  /** % of staff who are local */
  localEmploymentRate: number;
  /** Composite employment quality score (0–100) */
  employmentQuality: number;
  /** % of F&B spend that is local */
  localFbRate: number;
  /** % of non-F&B procurement spend that is local */
  localNonFbRate: number;
  /** % of bookings made direct */
  directBookingRate: number;
  /** % of business locally owned */
  localOwnershipPct: number;
  /** Community engagement score (0–100) */
  communityScore: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function safeDiv(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function computeP2Rates(raw: RawP2Inputs): DerivedP2Indicators {
  // ── Local employment rate ─────────────────────────────────────────────────
  let localEmploymentRate: number;
  if (raw.soloOperator) {
    localEmploymentRate = 100;
  } else {
    localEmploymentRate = clamp(safeDiv(raw.localFte ?? 0, raw.totalFte ?? 0) * 100);
  }

  // ── Employment quality ────────────────────────────────────────────────────
  let employmentQuality: number;
  if (raw.soloOperator) {
    employmentQuality = 100;
  } else {
    const permanentComponent = (raw.permanentContractPct ?? 0) * 0.5;
    const wageRatio = safeDiv(raw.averageMonthlyWage ?? 0, raw.minimumWage ?? 0);
    const wageComponent = wageRatio * 100 * 0.5;
    employmentQuality = clamp(permanentComponent + wageComponent);
  }

  // ── Local F&B rate ────────────────────────────────────────────────────────
  let localFbRate: number;
  if (raw.tourNoFbSpend) {
    localFbRate = 100;
  } else {
    localFbRate = clamp(safeDiv(raw.localFbSpend ?? 0, raw.totalFbSpend ?? 0) * 100);
  }

  // ── Local non-F&B rate ────────────────────────────────────────────────────
  let localNonFbRate: number;
  if (raw.tourNoNonFbSpend) {
    localNonFbRate = 100;
  } else {
    localNonFbRate = clamp(safeDiv(raw.localNonFbSpend ?? 0, raw.totalNonFbSpend ?? 0) * 100);
  }

  // ── Direct booking rate ───────────────────────────────────────────────────
  const directBookingRate = raw.allDirectBookings
    ? 100
    : clamp(raw.directBookingPct ?? 0);

  // ── Local ownership ───────────────────────────────────────────────────────
  const localOwnershipPct = clamp(raw.localOwnershipPct ?? 0);

  // ── Community score ───────────────────────────────────────────────────────
  const communityScore = clamp(raw.communityScore ?? 0);

  return {
    localEmploymentRate: round2(localEmploymentRate),
    employmentQuality: round2(employmentQuality),
    localFbRate: round2(localFbRate),
    localNonFbRate: round2(localNonFbRate),
    directBookingRate: round2(directBookingRate),
    localOwnershipPct: round2(localOwnershipPct),
    communityScore: round2(communityScore),
  };
}
