/**
 * UI display constants for GPS bands, DPS bands, and DPI pressure levels.
 * These are PRESENTATION constants only — not scoring definitions.
 * The actual band thresholds and scoring logic live in the TRT Scoring Engine.
 */

import type { GreenPassportBand, DpsBand } from "./engine/trt-scoring-engine/types";

export const GPS_BAND_CONFIG: Record<
  GreenPassportBand,
  { label: string; color: string; badgeVariant: string; description: string }
> = {
  regenerative_leader: {
    label: "Regenerative Leader",
    color: "bg-band-leader",
    badgeVariant: "default",
    description: "GPS 85–100 · Highest verified regenerative performance",
  },
  regenerative_practice: {
    label: "Regenerative Practice",
    color: "bg-band-practice",
    badgeVariant: "secondary",
    description: "GPS 70–84 · Demonstrated regenerative operations",
  },
  advancing: {
    label: "Advancing",
    color: "bg-band-advancing",
    badgeVariant: "outline",
    description: "GPS 55–69 · Solid progress toward regenerative standards",
  },
  developing: {
    label: "Developing",
    color: "bg-band-developing",
    badgeVariant: "outline",
    description: "GPS 40–54 · Meaningful foundations established",
  },
  not_yet_published: {
    label: "Not Yet Published",
    color: "bg-band-unpublished",
    badgeVariant: "outline",
    description: "GPS < 40 · Private assessment report",
  },
};

export const DPS_BAND_CONFIG: Record<
  DpsBand,
  { label: string; arrow: string; badgeVariant: string }
> = {
  accelerating: { label: "Accelerating", arrow: "↑↑", badgeVariant: "default" },
  progressing: { label: "Progressing", arrow: "↑", badgeVariant: "secondary" },
  stable: { label: "Stable", arrow: "→", badgeVariant: "outline" },
  regressing: { label: "Regressing", arrow: "↓", badgeVariant: "destructive" },
  critical: { label: "Critical", arrow: "↓↓", badgeVariant: "destructive" },
};

export const PRESSURE_CONFIG: Record<
  string,
  { label: string; badgeVariant: string; description: string }
> = {
  low: {
    label: "Low Pressure",
    badgeVariant: "default",
    description: "Destination managing tourism-system relationship effectively",
  },
  moderate: {
    label: "Moderate Pressure",
    badgeVariant: "secondary",
    description: "Meaningful tourism pressure — operators relevant to traveler choice",
  },
  high: {
    label: "High Pressure",
    badgeVariant: "destructive",
    description: "Ecologically sensitive or heavily touristed — operator GPS choice is highest-impact",
  },
};

export const OPERATOR_TYPES: Record<
  string,
  { label: string; description: string }
> = {
  A: { label: "Accommodation", description: "Hotels, B&Bs, guesthouses, eco-lodges" },
  B: { label: "Experience / Tours", description: "Guided tours, diving, hiking, activities" },
  C: { label: "Combined", description: "Both accommodation + experiences" },
};

export const P3_CATEGORIES = [
  {
    id: "Cat1",
    label: "Ecological monitoring / citizen science",
    description: "Biodiversity surveys, water quality monitoring, species programmes",
  },
  {
    id: "Cat2",
    label: "Habitat restoration / rewilding",
    description: "Native planting, invasive species removal, riparian restoration",
  },
  {
    id: "Cat3",
    label: "Marine & coastal conservation",
    description: "Reef monitoring, seagrass restoration, turtle nesting protection",
  },
  {
    id: "Cat4",
    label: "Cultural heritage documentation",
    description: "Oral history recording, craft preservation, language documentation",
  },
  {
    id: "Cat5",
    label: "Regenerative agriculture / soil health",
    description: "Agroforestry, composting, soil carbon sequestration",
  },
  {
    id: "Cat6",
    label: "Community resilience",
    description: "Youth employment skills, food sovereignty, social enterprise",
  },
  {
    id: "Cat7",
    label: "Scientific research co-production",
    description: "Co-authored publications, field station support, monitoring datasets",
  },
];

/**
 * Human-readable labels for evidence indicator IDs.
 * Used in the evidence linkage step to display which metric each file covers.
 */
export const INDICATOR_LABELS: Record<string, string> = {
  p1_energy_intensity:    "1A — Energy Intensity",
  p1_renewable_pct:       "1A — Renewable Energy %",
  p1_water_intensity:     "1B — Water Intensity",
  p1_recirculation:       "1B — Water Recirculation",
  p1_waste_diversion_pct: "1C — Waste Diversion Rate",
  p1_carbon_intensity:    "1D — Carbon Intensity",
  p1_site_score:          "1E — Site & Land Use",
  p2_local_employment:    "2A — Local Employment Rate",
  p2_employment_quality:  "2A — Employment Quality",
  p2_local_fb_rate:       "2B — Local F&B Procurement",
  p2_local_nonfb_rate:    "2B — Local Non-F&B Procurement",
  p2_direct_booking_rate: "2C — Direct Booking Rate",
  p2_local_ownership_pct: "2C — Local Ownership %",
  p2_community_score:     "2D — Community Integration",
  p3_programme:           "3 — Regenerative Programme",
};

/**
 * Pre-normalised categoryScope scores per P3 category.
 *
 * These represent the systemic leverage / breadth score (0–100) assigned to
 * each category as defined in the Operator Assessment Form v3 methodology.
 * When an operator engages multiple categories the highest single score is
 * used; collective bonuses are handled separately in the engine.
 *
 * This mapping must be kept in sync with the MethodologyBundle version.
 * Methodology version: 1.0.0
 */
export const P3_CATEGORY_SCOPE_SCORES: Record<string, number> = {
  Cat1: 75,  // Ecological monitoring — high systemic leverage
  Cat2: 100, // Habitat restoration — highest scope score
  Cat3: 100, // Marine & coastal — highest scope score
  Cat4: 50,  // Cultural heritage — medium scope
  Cat5: 75,  // Regenerative agriculture — high scope
  Cat6: 50,  // Community resilience — medium scope
  Cat7: 75,  // Scientific co-production — high scope
};

/**
 * Compute the pre-normalised categoryScope score (0–100) from a list of
 * selected P3 category IDs. Returns the highest single-category score.
 * Returns 0 if no categories are selected.
 */
export function computeCategoryScope(categoryIds: string[]): number {
  if (!categoryIds.length) return 0;
  return Math.max(
    ...categoryIds.map((id) => P3_CATEGORY_SCOPE_SCORES[id] ?? 0)
  );
}
