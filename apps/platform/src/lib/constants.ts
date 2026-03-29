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
