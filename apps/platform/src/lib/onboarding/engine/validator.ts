/**
 * Validator
 *
 * Validates steps and overall flow completeness using OnboardingState.
 * Uses the step-registry validators — no inline logic here.
 */

import { STEP_REGISTRY } from '../registry/step-registry';
import { buildFlow } from './flow-builder';
import type { OnboardingState, StepId } from '../types';

/**
 * Returns true if the given step's validation passes for the provided state.
 * Steps without an explicit validator are considered valid.
 */
export function validateStep(stepId: StepId, state: OnboardingState): boolean {
  const step = STEP_REGISTRY[stepId];
  if (!step?.validate) return true;
  return step.validate(state);
}

/**
 * Returns all step IDs in the current flow that fail validation.
 */
export function getInvalidSteps(state: OnboardingState): StepId[] {
  return buildFlow(state).filter((id) => !validateStep(id, state));
}

/**
 * Returns true if all steps in the current flow are valid (ready for submission).
 */
export function isFlowComplete(state: OnboardingState): boolean {
  return getInvalidSteps(state).length === 0;
}
