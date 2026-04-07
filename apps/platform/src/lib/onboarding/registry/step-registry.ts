/**
 * Step Registry
 *
 * Single source of truth for all step definitions.
 *
 * Steps are namespaced: '<section-or-capability>:<name>'
 * e.g. 'pillar1:energy', 'accommodation:setup', 'base:identity'
 *
 * capability — only set for profile-level steps (base, accommodation, tours).
 * section    — only set for assessment section steps (pillar1, pillar2, pillar3, evidence, review).
 *
 * Pillar/evidence/review steps do NOT have capability. They apply to all operators
 * and are included via SECTION_REGISTRY, not via CAPABILITY_REGISTRY.
 */

import type { OnboardingState, StepDefinition } from '../types';

// ── Validation helpers ────────────────────────────────────────────────────────

function isNonEmpty(v: string | undefined | null): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPos(v: number | undefined | null): boolean {
  return typeof v === 'number' && isFinite(v) && v > 0;
}

function isNonNeg(v: number | undefined | null): boolean {
  return typeof v === 'number' && isFinite(v) && v >= 0;
}

const isToursOnly = (s: OnboardingState) =>
  s.capabilities.includes('tours') && !s.capabilities.includes('accommodation');

const hasBothCapabilities = (s: OnboardingState) =>
  s.capabilities.includes('accommodation') && s.capabilities.includes('tours');

// ── Step definitions ──────────────────────────────────────────────────────────

export const STEP_REGISTRY: Record<string, StepDefinition> = {

  // ── Base profile steps (capability: 'base') ───────────────────────────────

  'base:capability-select': {
    id: 'base:capability-select',
    capability: 'base',
    label: 'Operator Type',
    sectionLabel: 'Your Operation',
    validate: (s) =>
      s.capabilities.includes('accommodation') || s.capabilities.includes('tours'),
  },

  'base:identity': {
    id: 'base:identity',
    capability: 'base',
    label: 'About Your Business',
    sectionLabel: 'Your Operation',
    validate: (s) => isNonEmpty(s.base.legalName) && isNonEmpty(s.base.country),
  },

  'base:revenue-split': {
    id: 'base:revenue-split',
    capability: 'base',
    label: 'Revenue Split',
    sectionLabel: 'Your Operation',
    condition: hasBothCapabilities,
    validate: (s) => {
      const acc = s.activity.revenueSplitAccommodationPct ?? 0;
      const exp = s.activity.revenueSplitExperiencePct ?? 0;
      return Math.abs(acc + exp - 100) < 0.01;
    },
  },

  'base:photos': {
    id: 'base:photos',
    capability: 'base',
    label: 'Photos',
    sectionLabel: 'Your Operation',
    validate: (s) => (s.base.photoRefs?.length ?? 0) >= 1,
  },

  // ── Accommodation capability steps (capability: 'accommodation') ──────────

  'accommodation:setup': {
    id: 'accommodation:setup',
    capability: 'accommodation',
    label: 'Your Accommodation',
    sectionLabel: 'Your Operation',
    condition: (s) => s.capabilities.includes('accommodation'),
    validate: (s) =>
      isNonEmpty(s.accommodation.accommodationCategory) &&
      isPos(s.accommodation.rooms) &&
      isPos(s.accommodation.guestNights),
  },

  // ── Tours capability steps (capability: 'tours') ──────────────────────────

  'tours:setup': {
    id: 'tours:setup',
    capability: 'tours',
    label: 'Your Experiences',
    sectionLabel: 'Your Operation',
    condition: (s) => s.capabilities.includes('tours'),
    validate: (s) =>
      (s.tours.experienceTypes?.length ?? 0) > 0 && isPos(s.tours.visitorDays),
  },

  // ── Pillar 1 steps (section: 'pillar1', no capability) ───────────────────

  'pillar1:energy': {
    id: 'pillar1:energy',
    section: 'pillar1',
    label: 'Energy',
    sectionLabel: 'Pillar 1 — Operational Footprint',
    validate: (s) => {
      const p1 = s.pillar1;
      const gridOffice = isNonNeg(p1.officeElectricityKwh) || isNonNeg(p1.gridExportKwh);
      const accEleGas = isNonNeg(p1.totalElectricityKwh) || isNonNeg(p1.totalGasKwh);
      if (isToursOnly(s)) {
        const baseEle = accEleGas || gridOffice;
        const transportOk =
          s.tours.tourNoTransport === true ||
          p1.tourFuelType === 'no_vehicle' ||
          (p1.tourFuelType === 'electric' && isNonNeg(p1.evKwhPerMonth)) ||
          (!!p1.tourFuelType &&
            p1.tourFuelType !== 'electric' &&
            p1.tourFuelType !== 'no_vehicle' &&
            isNonNeg(p1.tourFuelLitresPerMonth));
        return baseEle || transportOk;
      }
      return accEleGas || gridOffice;
    },
  },

  'pillar1:water': {
    id: 'pillar1:water',
    section: 'pillar1',
    label: 'Water',
    sectionLabel: 'Pillar 1 — Operational Footprint',
    condition: (s) => !(isToursOnly(s) && s.tours.tourNoFixedBase === true),
    validate: (s) => {
      if (isToursOnly(s) && s.tours.tourNoFixedBase === true) return true;
      const p1 = s.pillar1;
      return (
        isNonNeg(p1.totalWaterLitres) &&
        typeof p1.waterGreywater === 'boolean' &&
        typeof p1.waterRainwater === 'boolean' &&
        typeof p1.waterWastewaterTreatment === 'boolean'
      );
    },
  },

  'pillar1:waste': {
    id: 'pillar1:waste',
    section: 'pillar1',
    label: 'Waste',
    sectionLabel: 'Pillar 1 — Operational Footprint',
    validate: (s) => isNonNeg(s.pillar1.totalWasteKg),
  },

  'pillar1:carbon': {
    id: 'pillar1:carbon',
    section: 'pillar1',
    label: 'Carbon',
    sectionLabel: 'Pillar 1 — Operational Footprint',
    validate: () => true,
  },

  'pillar1:site': {
    id: 'pillar1:site',
    section: 'pillar1',
    label: 'Site & Land Use',
    sectionLabel: 'Pillar 1 — Operational Footprint',
    validate: (s) => {
      const score = s.pillar1.p1SiteScore;
      return typeof score === 'number' && score >= 0 && score <= 4;
    },
  },

  // ── Pillar 2 steps (section: 'pillar2', no capability) ───────────────────

  'pillar2:employment': {
    id: 'pillar2:employment',
    section: 'pillar2',
    label: 'Your Team',
    sectionLabel: 'Pillar 2 — Local Integration',
    validate: (s) => {
      if (s.base.soloOperator) return true;
      const p2 = s.pillar2;
      return (
        isPos(p2.totalFte) &&
        isNonNeg(p2.localFte) &&
        isNonNeg(p2.permanentContractPct) &&
        isPos(p2.averageMonthlyWage)
      );
    },
  },

  'pillar2:procurement': {
    id: 'pillar2:procurement',
    section: 'pillar2',
    label: 'Where You Buy From',
    sectionLabel: 'Pillar 2 — Local Integration',
    validate: (s) => {
      const p2 = s.pillar2;
      const fbOk = p2.tourNoFbSpend === true || isNonNeg(p2.totalFbSpend);
      const nonFbOk = p2.tourNoNonFbSpend === true || isNonNeg(p2.totalNonFbSpend);
      return fbOk && nonFbOk;
    },
  },

  'pillar2:revenue': {
    id: 'pillar2:revenue',
    section: 'pillar2',
    label: 'How Guests Book',
    sectionLabel: 'Pillar 2 — Local Integration',
    validate: (s) => {
      const p2 = s.pillar2;
      return (
        isPos(p2.totalBookingsCount) &&
        (p2.allDirectBookings === true || isNonNeg(p2.directBookingPct)) &&
        !!p2.evidenceTierRevenue
      );
    },
  },

  'pillar2:community': {
    id: 'pillar2:community',
    section: 'pillar2',
    label: 'Community Engagement',
    sectionLabel: 'Pillar 2 — Local Integration',
    validate: (s) =>
      typeof s.pillar2.communityScore === 'number' && !!s.pillar2.evidenceTierCommunity,
  },

  // ── Pillar 3 steps (section: 'pillar3', no capability) ───────────────────

  'pillar3:status': {
    id: 'pillar3:status',
    section: 'pillar3',
    label: 'Giving Back',
    sectionLabel: 'Pillar 3 — Regenerative Contribution',
    validate: (s) => ['A', 'B', 'C', 'D', 'E'].includes(s.pillar3.p3Status ?? ''),
  },

  'pillar3:programme': {
    id: 'pillar3:programme',
    section: 'pillar3',
    label: 'Programme Details',
    sectionLabel: 'Pillar 3 — Regenerative Contribution',
    condition: (s) => ['A', 'B', 'C'].includes(s.pillar3.p3Status ?? ''),
    validate: (s) => {
      const p3 = s.pillar3;
      if (!['A', 'B', 'C'].includes(p3.p3Status ?? '')) return true;
      return (
        (p3.p3ContributionCategories?.length ?? 0) > 0 &&
        typeof p3.p3Traceability === 'number' &&
        typeof p3.p3Additionality === 'number' &&
        typeof p3.p3Continuity === 'number'
      );
    },
  },

  'pillar3:forward-commitment': {
    id: 'pillar3:forward-commitment',
    section: 'pillar3',
    label: 'Forward Commitment',
    sectionLabel: 'Pillar 3 — Regenerative Contribution',
    condition: (s) => s.pillar3.p3Status === 'D',
    validate: (s) => {
      const p3 = s.pillar3;
      if (p3.p3Status !== 'D') return true;
      return (
        isNonEmpty(p3.forwardCommitmentPreferredCategory) &&
        isNonEmpty(p3.forwardCommitmentSignatory)
      );
    },
  },

  // ── Evidence steps (section: 'evidence', no capability) ──────────────────

  'evidence:delta': {
    id: 'evidence:delta',
    section: 'evidence',
    label: 'Prior Cycle',
    sectionLabel: 'Review',
    condition: (s) =>
      typeof s.evidence.assessmentCycle === 'number' && s.evidence.assessmentCycle > 1,
    validate: () => true,
  },

  'evidence:checklist': {
    id: 'evidence:checklist',
    section: 'evidence',
    label: 'Evidence Checklist',
    sectionLabel: 'Review',
    validate: () => true,
  },

  // ── Review steps (section: 'review', no capability) ──────────────────────

  'review:gps-preview': {
    id: 'review:gps-preview',
    section: 'review',
    label: 'Your Score',
    sectionLabel: 'Review & Submit',
    validate: () => true,
  },

  'review:submit': {
    id: 'review:submit',
    section: 'review',
    label: 'Review & Submit',
    sectionLabel: 'Review & Submit',
    validate: () => true,
  },

} as const;
