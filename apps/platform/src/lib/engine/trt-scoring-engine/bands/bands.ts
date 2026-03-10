import type { GreenPassportBand, MethodologyBundle } from "../types";

/**
 * Assign a Green Passport classification band to a GPS score.
 * Uses exact thresholds from the MethodologyBundle — no rounding to adjacent bands.
 */
export function getGpsBand(
  score: number,
  thresholds: MethodologyBundle["bandThresholds"]
): GreenPassportBand {
  if (score >= thresholds.regenerativeLeader) return "regenerative_leader";
  if (score >= thresholds.regenerativePractice) return "regenerative_practice";
  if (score >= thresholds.advancing) return "advancing";
  if (score >= thresholds.developing) return "developing";
  return "not_yet_published";
}
