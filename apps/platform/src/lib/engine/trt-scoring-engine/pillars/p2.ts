import type { P2Responses, MethodologyBundle } from "../types";
import { normalizeValue, normalizeDiscreteScore } from "./normalise";

export interface P2Result {
  readonly score: number;
  readonly subScores: {
    readonly p2a: number;
    readonly p2b: number;
    readonly p2c: number;
    readonly p2d: number;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Compute Pillar 2 — Local Integration.
 */
export function computeP2(
  responses: P2Responses,
  operatorType: "A" | "B" | "C",
  methodology: MethodologyBundle
): P2Result {
  const nb =
    operatorType === "B" && methodology.normalizationBoundsTours
      ? methodology.normalizationBoundsTours
      : methodology.normalizationBounds;

  const w = methodology.p2SubWeights;
  const cw = methodology.p1CompositeWeights;

  // 2A: Employment — local rate + quality composite
  const localEmpScore = normalizeValue(
    responses.localEmploymentRate,
    nb["p2_local_employment"]
  );
  const empQualityScore = clamp(responses.employmentQuality ?? 0, 0, 100);
  const p2a =
    localEmpScore * cw.localEmploymentRateIn2a +
    empQualityScore * cw.employmentQualityIn2a;

  // 2B: Procurement — food+bev and non-food+bev local rates
  const p2bFb = normalizeValue(responses.localFbRate, nb["p2_local_fb_rate"]);
  const p2bNonfb = normalizeValue(
    responses.localNonfbRate,
    nb["p2_local_nonfb_rate"]
  );
  const p2b = (p2bFb + p2bNonfb) / 2;

  // 2C: Revenue retention — direct booking + local ownership
  const p2cBooking = normalizeValue(
    responses.directBookingRate,
    nb["p2_direct_booking_rate"]
  );
  const p2cOwnership = normalizeValue(
    responses.localOwnershipPct,
    nb["p2_local_ownership_pct"]
  );
  const p2c = (p2cBooking + p2cOwnership) / 2;

  // 2D: Community integration — discrete 0-4
  const p2d = normalizeDiscreteScore(responses.communityScore, 4);

  const score = Math.round(
    p2a * w.employment +
    p2b * w.procurement +
    p2c * w.revenueRetention +
    p2d * w.community
  );

  return {
    score,
    subScores: { p2a, p2b, p2c, p2d },
  };
}
