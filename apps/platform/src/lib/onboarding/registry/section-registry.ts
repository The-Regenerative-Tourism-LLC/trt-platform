/**
 * Section Registry
 *
 * Assessment sections that are always present in the onboarding flow,
 * regardless of which business capabilities are selected.
 *
 * Sections are distinct from capabilities:
 * - Capabilities: what the operator offers (accommodation, tours)
 * - Sections: how we assess sustainability (pillar1, pillar2, pillar3, evidence, review)
 *
 * All section steps use capability: 'base' in the step registry, because they
 * apply to every operator.
 */

import type { SectionDefinition, SectionId } from '../types';

export const SECTION_REGISTRY: Record<SectionId, SectionDefinition> = {
  pillar1: {
    id: 'pillar1',
    label: 'Operational Footprint',
    shortLabel: 'P1',
    steps: [
      'pillar1:energy',
      'pillar1:water',
      'pillar1:waste',
      'pillar1:carbon',
      'pillar1:site',
    ],
  },

  pillar2: {
    id: 'pillar2',
    label: 'Local Integration',
    shortLabel: 'P2',
    steps: [
      'pillar2:employment',
      'pillar2:procurement',
      'pillar2:revenue',
      'pillar2:community',
    ],
  },

  pillar3: {
    id: 'pillar3',
    label: 'Regenerative Contribution',
    shortLabel: 'P3',
    steps: [
      'pillar3:status',
      'pillar3:programme',
      'pillar3:forward-commitment',
    ],
  },

  evidence: {
    id: 'evidence',
    label: 'Evidence',
    shortLabel: 'Evidence',
    steps: [
      'evidence:delta',
      'evidence:checklist',
    ],
  },

  review: {
    id: 'review',
    label: 'Review & Submit',
    shortLabel: 'Submit',
    steps: [
      'review:gps-preview',
      'review:submit',
    ],
  },
};

/** Ordered section IDs — defines the assessment flow after profile/capability steps. */
export const SECTION_ORDER: readonly SectionId[] = [
  'pillar1',
  'pillar2',
  'pillar3',
  'evidence',
  'review',
] as const;
