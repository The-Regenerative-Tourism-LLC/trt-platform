/**
 * Flat Compatibility Layer
 *
 * Converts between the new sliced OnboardingState and the flat OnboardingData
 * shape expected by existing step components and the scoring API.
 *
 * TODO: remove flat compatibility after migration is complete and all step
 * components have been updated to consume OnboardingState slices directly.
 */

import type { OnboardingState } from '../types';
import type { OnboardingData } from '../onboarding-steps';
import { deriveOperatorType } from '../types';

/**
 * Produces a flat OnboardingData object from the sliced OnboardingState.
 * Used by the store to maintain the backward-compat `data` field consumed
 * by existing step components.
 */
export function computeFlatData(state: OnboardingState): OnboardingData {
  return {
    operatorType: deriveOperatorType(state.capabilities),
    ...state.base,
    ...state.accommodation,
    ...state.tours,
    ...state.activity,
    ...state.pillar1,
    ...state.pillar2,
    ...state.pillar3,
    ...state.evidence,
  } as OnboardingData;
}

/**
 * Produces a plain Record from the sliced OnboardingState.
 * Used by saveDraft() and the scoring API payload builder.
 */
export function flattenState(state: OnboardingState): Record<string, unknown> {
  return computeFlatData(state) as Record<string, unknown>;
}
