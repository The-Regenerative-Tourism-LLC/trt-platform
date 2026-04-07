/**
 * Capability Registry
 *
 * Defines the three business capabilities an operator can offer.
 * Pillar1/2/3, evidence, and review are NOT capabilities — they are assessment
 * sections defined in section-registry.ts.
 *
 * The 'base' capability is always active (condition: () => true).
 * 'accommodation' and 'tours' are active based on operator selection.
 */

import type { CapabilityDefinition, CapabilityId } from '../types';

export const CAPABILITY_REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  base: {
    id: 'base',
    label: 'Core Profile',
    shortLabel: 'Profile',
    // All base profile steps in flow order.
    // 'base:revenue-split' is filtered out by its own condition when only one capability is active.
    steps: ['base:capability-select', 'base:identity', 'base:revenue-split', 'base:photos'],
    // Base is always active — never conditional on user selection
    condition: () => true,
  },

  accommodation: {
    id: 'accommodation',
    label: 'Accommodation',
    shortLabel: 'Accommodation',
    steps: ['accommodation:setup'],
    condition: (selected) => selected.includes('accommodation'),
  },

  tours: {
    id: 'tours',
    label: 'Experiences & Tours',
    shortLabel: 'Tours',
    steps: ['tours:setup'],
    condition: (selected) => selected.includes('tours'),
  },
};

/** Ordered capability IDs for profile section flow assembly. */
export const CAPABILITY_ORDER: readonly CapabilityId[] = ['base', 'accommodation', 'tours'] as const;
