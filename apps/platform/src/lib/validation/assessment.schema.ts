import { z } from "zod";

// ── Operator Profile (Section 0) ───────────────────────────────────────────

export const OperatorTypeSchema = z.enum(["A", "B", "C"]);
export const P3StatusSchema = z.enum(["A", "B", "C", "D", "E"]);

export const ActivityUnitSchema = z.object({
  guestNights: z.number().nonnegative().optional(),
  visitorDays: z.number().nonnegative().optional(),
});

export const RevenueSplitSchema = z.object({
  accommodationPct: z.number().min(0).max(100).optional(),
  experiencePct: z.number().min(0).max(100).optional(),
});

// ── Pillar 1 Responses ─────────────────────────────────────────────────────

export const P1ResponsesSchema = z.object({
  energyIntensity: z.number().nonnegative().nullable(),
  renewablePct: z.number().min(0).max(100).nullable(),
  waterIntensity: z.number().nonnegative().nullable(),
  recirculationScore: z.number().int().min(0).max(3).nullable(),
  wasteDiversionPct: z.number().min(0).max(100).nullable(),
  carbonIntensity: z.number().nonnegative().nullable(),
  siteScore: z.number().int().min(0).max(4).nullable(),
});

// ── Pillar 2 Responses ─────────────────────────────────────────────────────

export const P2ResponsesSchema = z.object({
  localEmploymentRate: z.number().min(0).max(100).nullable(),
  employmentQuality: z.number().min(0).max(100).nullable(),
  localFbRate: z.number().min(0).max(100).nullable(),
  localNonfbRate: z.number().min(0).max(100).nullable(),
  directBookingRate: z.number().min(0).max(100).nullable(),
  localOwnershipPct: z.number().min(0).max(100).nullable(),
  communityScore: z.number().int().min(0).max(4).nullable(),
});

// ── Pillar 3 Responses ─────────────────────────────────────────────────────

export const P3ResponsesSchema = z.object({
  categoryScope: z.number().min(0).max(100).nullable(),
  traceability: z.union([z.literal(0), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).nullable(),
  additionality: z.union([z.literal(0), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).nullable(),
  continuity: z.union([z.literal(0), z.literal(25), z.literal(50), z.literal(75), z.literal(100)]).nullable(),
});

// ── Delta Block ────────────────────────────────────────────────────────────

export const DeltaBlockSchema = z.object({
  priorCycle: z.number().int().min(1),
  baselineScores: z.record(z.string(), z.number()),
  priorScores: z.record(z.string(), z.number()),
  currentScores: z.record(z.string(), z.number()),
});

// ── Evidence Ref ───────────────────────────────────────────────────────────

export const EvidenceRefSchema = z.object({
  indicatorId: z.string().min(1),
  tier: z.enum(["T1", "T2", "T3", "Proxy"]),
  checksum: z.string().min(1),
  verificationState: z.enum(["pending", "verified", "rejected", "lapsed"]),
});

// ── Assessment Snapshot ────────────────────────────────────────────────────

export const AssessmentSnapshotSchema = z.object({
  operatorId: z.string().min(1),
  operatorType: OperatorTypeSchema,
  activityUnit: ActivityUnitSchema,
  revenueSplit: RevenueSplitSchema.optional(),
  assessmentCycle: z.number().int().min(1),
  assessmentPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pillar1: P1ResponsesSchema,
  pillar2: P2ResponsesSchema,
  pillar3: P3ResponsesSchema,
  p3Status: P3StatusSchema,
  delta: DeltaBlockSchema.nullable(),
  evidence: z.array(EvidenceRefSchema),
  snapshotHash: z.string().min(1),
  createdAt: z.string().datetime(),
});

// ── Operator Onboarding Input ──────────────────────────────────────────────

export const OnboardingProfileSchema = z.object({
  legalName: z.string().min(1),
  tradingName: z.string().optional(),
  country: z.string().min(1),
  destinationRegion: z.string().min(1),
  operatorType: OperatorTypeSchema,
  yearOperationStart: z.number().int().min(1900).max(2030).optional(),
  website: z.string().url().optional().or(z.literal("")),
  primaryContactName: z.string().min(1),
  primaryContactEmail: z.string().email(),
  accommodationCategory: z.string().optional(),
  rooms: z.number().int().nonnegative().optional(),
  bedCapacity: z.number().int().nonnegative().optional(),
  experienceTypes: z.array(z.string()).optional(),
  ownershipType: z.string().optional(),
  localEquityPct: z.number().min(0).max(100).optional(),
  isChainMember: z.boolean().optional(),
  chainName: z.string().optional(),
});

export type OnboardingProfileInput = z.infer<typeof OnboardingProfileSchema>;
export type AssessmentSnapshotInput = z.infer<typeof AssessmentSnapshotSchema>;
