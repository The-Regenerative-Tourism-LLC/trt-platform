import { z } from "zod";

// ── DPI Snapshot ───────────────────────────────────────────────────────────

export const DpiSnapshotSchema = z.object({
  territoryId: z.string().min(1),
  touristIntensity: z.number().min(0).max(100),
  ecologicalSensitivity: z.number().min(0).max(100),
  economicLeakageRate: z.number().min(0).max(100),
  regenerativePerf: z.number().min(0).max(100),
  compositeDpi: z.number().min(0).max(100),
  pressureLevel: z.enum(["low", "moderate", "high"]),
  snapshotHash: z.string().min(1),
  createdAt: z.string().datetime(),
});

// ── Score Snapshot ─────────────────────────────────────────────────────────

export const ScoreSnapshotSchema = z.object({
  assessmentSnapshotId: z.string().min(1),
  methodologyVersion: z.string().min(1),
  gpsTotal: z.number().min(0).max(100),
  gpsBand: z.enum([
    "regenerative_leader",
    "regenerative_practice",
    "advancing",
    "developing",
    "not_yet_published",
  ]),
  p1Score: z.number().min(0).max(100),
  p2Score: z.number().min(0).max(100),
  p3Score: z.number().min(0).max(100),
  dpsTotal: z.number().nullable(),
  dps1: z.number().nullable(),
  dps2: z.number().nullable(),
  dps3: z.number().nullable(),
  dpsBand: z
    .enum(["accelerating", "progressing", "stable", "regressing", "critical"])
    .nullable(),
  dpiScore: z.number().min(0).max(100),
  dpiPressureLevel: z.enum(["low", "moderate", "high"]),
  computationTrace: z.record(z.unknown()),
  inputHash: z.string().min(1),
  methodologyHash: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type DpiSnapshotInput = z.infer<typeof DpiSnapshotSchema>;
export type ScoreSnapshotInput = z.infer<typeof ScoreSnapshotSchema>;
