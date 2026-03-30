"use client";

/**
 * Onboarding UI Store (Zustand)
 *
 * This store holds LOCAL UI state for the operator onboarding form.
 * It is NOT authoritative for scores — it collects form data before
 * submission to the API route, which delegates to the scoring orchestrator.
 *
 * Zustand stores in this codebase are ONLY for UI state.
 * No scoring logic of any kind is permitted here.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingFormData {
  // Section 0 — Operator Profile
  operatorType?: "A" | "B" | "C";
  legalName?: string;
  tradingName?: string;
  country?: string;
  destinationRegion?: string;
  territoryId?: string;
  guestNights?: number;
  visitorDays?: number;
  revenueSplitAccommodationPct?: number;
  revenueSplitExperiencePct?: number;
  assessmentPeriodEnd?: string; // ISO8601 date — 12-month period end
  accommodationCategory?: string;
  rooms?: number;
  bedCapacity?: number;
  yearOperationStart?: number;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  experienceTypes?: string[];
  ownershipType?: string;
  localEquityPct?: number;
  isChainMember?: boolean;
  chainName?: string;

  // Section 1 — Pillar 1 (Operational Footprint)
  p1EnergyIntensity?: number;
  p1RenewablePct?: number;
  p1WaterIntensity?: number;
  p1RecirculationScore?: number;
  p1WasteDiversionPct?: number;
  p1CarbonIntensity?: number;
  p1SiteScore?: number;

  // Section 2 — Pillar 2 (Local Integration)
  p2LocalEmploymentRate?: number;
  p2EmploymentQuality?: number;
  p2LocalFbRate?: number;
  p2LocalNonfbRate?: number;
  p2DirectBookingRate?: number;
  p2LocalOwnershipPct?: number;
  p2CommunityScore?: number;

  // Section 3 — Pillar 3 (Regenerative Contribution)
  p3Status?: "A" | "B" | "C" | "D" | "E";
  p3CategoryScope?: number;
  p3Traceability?: number;
  p3Additionality?: number;
  p3Continuity?: number;
  p3ContributionCategories?: string[];
  p3ProgrammeDescription?: string;
  p3ProgrammeDuration?: string;
  p3GeographicScope?: string;
  p3AnnualBudget?: number;
  p3GuestsParticipating?: number;
  p3IsCollective?: boolean;
  p3CollectiveSize?: string;
  p3CollectiveTotalBudget?: number;
  p3CollectiveSharePct?: number;
  p3InstitutionName?: string;

  // Forward commitment
  forwardCommitmentPreferredCategory?: string;
  forwardCommitmentTerritoryContext?: string;
  forwardCommitmentTargetCycle?: number;
  forwardCommitmentSignatory?: string;

  // Evidence
  evidenceRefs?: Array<{
    indicatorId: string;
    tier: "T1" | "T2" | "T3" | "Proxy";
    checksum: string;
    verificationState: "pending" | "verified" | "rejected" | "lapsed";
  }>;
}

interface OnboardingStore {
  step: number;
  data: OnboardingFormData;
  setStep: (step: number) => void;
  updateData: (patch: Partial<OnboardingFormData>) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 0,
      data: {},
      setStep: (step) => set({ step }),
      updateData: (patch) =>
        set((state) => ({ data: { ...state.data, ...patch } })),
      resetOnboarding: () => set({ step: 0, data: {} }),
    }),
    {
      name: "trt-onboarding",
      partialize: (state) => ({ step: state.step, data: state.data }),
    }
  )
);
