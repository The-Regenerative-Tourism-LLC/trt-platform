/**
 * Normalisation bounds for onboarding form preview bars.
 *
 * These values mirror the normalizationBounds defined in the active
 * MethodologyBundle (v1.0.0). They are PRESENTATION constants —
 * safe for frontend import — and must NOT be used for actual scoring.
 *
 * The authoritative bounds live in:
 *   lib/methodology/default-bundle.ts → normalizationBounds / normalizationBoundsTours
 *
 * When the methodology version changes, these constants must be updated
 * to match. A comment links each set to its source field.
 *
 * Methodology version this was extracted from: 1.0.0
 */

import type { PreviewBounds } from "../utils/preview-normalise";

/** Accommodation + Combined operators (Type A / Type C) */
export const PREVIEW_BOUNDS_ACCOMMODATION: Record<string, PreviewBounds> = {
  p1_energy_intensity:    { b100: 15,  b75: 30,  b50: 55,  b25: 80,  dir: "lower_is_better" },
  p1_renewable_pct:       { b100: 100, b75: 75,  b50: 50,  b25: 25,  dir: "higher_is_better" },
  p1_water_intensity:     { b100: 80,  b75: 150, b50: 250, b25: 400, dir: "lower_is_better" },
  p1_waste_diversion_pct: { b100: 80,  b75: 60,  b50: 40,  b25: 20,  dir: "higher_is_better" },
  p1_carbon_intensity:    { b100: 5,   b75: 15,  b50: 30,  b25: 50,  dir: "lower_is_better" },
  p2_local_employment:    { b100: 80,  b75: 60,  b50: 40,  b25: 20,  dir: "higher_is_better" },
  p2_local_fb_rate:       { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_local_nonfb_rate:    { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_direct_booking_rate: { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_local_ownership_pct: { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
};

/** Experience operators (Type B) — different operational scale */
export const PREVIEW_BOUNDS_TOURS: Record<string, PreviewBounds> = {
  p1_energy_intensity:    { b100: 2,   b75: 5,   b50: 10,  b25: 20,  dir: "lower_is_better" },
  p1_renewable_pct:       { b100: 100, b75: 75,  b50: 50,  b25: 25,  dir: "higher_is_better" },
  p1_water_intensity:     { b100: 1,   b75: 3,   b50: 5,   b25: 10,  dir: "lower_is_better" },
  p1_waste_diversion_pct: { b100: 80,  b75: 60,  b50: 40,  b25: 20,  dir: "higher_is_better" },
  p1_carbon_intensity:    { b100: 1,   b75: 3,   b50: 8,   b25: 15,  dir: "lower_is_better" },
  p2_local_employment:    { b100: 80,  b75: 60,  b50: 40,  b25: 20,  dir: "higher_is_better" },
  p2_local_fb_rate:       { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_local_nonfb_rate:    { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_direct_booking_rate: { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
  p2_local_ownership_pct: { b100: 70,  b75: 50,  b50: 30,  b25: 10,  dir: "higher_is_better" },
};
