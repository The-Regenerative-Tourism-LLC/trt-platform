/**
 * Flow Builder
 *
 * Pure functions — same input always produces the same output.
 * No side effects. No hardcoded step arrays.
 *
 * buildFlow() assembles the ordered step list dynamically from:
 *   1. CAPABILITY_REGISTRY  — profile steps (base, accommodation, tours)
 *   2. SECTION_REGISTRY     — assessment steps (pillar1 → pillar2 → pillar3 → evidence → review)
 *
 * Individual step conditions are applied after assembly to filter hidden steps.
 */

import { CAPABILITY_REGISTRY, CAPABILITY_ORDER } from '../registry/capability-registry';
import { SECTION_REGISTRY, SECTION_ORDER } from '../registry/section-registry';
import { STEP_REGISTRY } from '../registry/step-registry';
import type { OnboardingState, StepId, SectionProgress } from '../types';

/**
 * Returns the ordered list of visible step IDs for the given state.
 * Deterministic: same state always produces the same flow.
 */
export function buildFlow(state: OnboardingState): StepId[] {
  const flow: StepId[] = [];

  // 1. Profile steps — iterate capabilities in fixed order
  for (const capId of CAPABILITY_ORDER) {
    const cap = CAPABILITY_REGISTRY[capId];
    if (!cap.condition(state.capabilities, state)) continue;
    for (const stepId of cap.steps) {
      flow.push(stepId);
    }
  }

  // 2. Assessment section steps — iterate sections in fixed order
  for (const sectionId of SECTION_ORDER) {
    for (const stepId of SECTION_REGISTRY[sectionId].steps) {
      flow.push(stepId);
    }
  }

  // 3. Filter: remove steps whose condition returns false
  return flow.filter((stepId) => {
    const step = STEP_REGISTRY[stepId];
    if (!step) return false;
    if (step.condition && !step.condition(state)) return false;
    return true;
  });
}

/**
 * Returns the 1-based position of stepId in the flow, and the total step count.
 */
export function getStepPosition(
  stepId: StepId,
  state: OnboardingState
): { current: number; total: number } {
  const flow = buildFlow(state);
  const idx = flow.indexOf(stepId);
  return { current: idx + 1, total: flow.length };
}

/**
 * Returns the next step ID, or null if stepId is the last step.
 */
export function getNextStepId(
  currentStepId: StepId,
  state: OnboardingState
): StepId | null {
  const flow = buildFlow(state);
  const idx = flow.indexOf(currentStepId);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

/**
 * Returns the previous step ID, or null if stepId is the first step.
 */
export function getPrevStepId(
  currentStepId: StepId,
  state: OnboardingState
): StepId | null {
  const flow = buildFlow(state);
  const idx = flow.indexOf(currentStepId);
  if (idx <= 0) return null;
  return flow[idx - 1];
}

/**
 * Returns true if stepId is the last step in the current flow.
 */
export function isLastStep(stepId: StepId, state: OnboardingState): boolean {
  return getNextStepId(stepId, state) === null;
}

/**
 * Returns per-section progress for the progress bar.
 * Profile section covers all capability steps; assessment sections cover SECTION_REGISTRY steps.
 */
export function getSectionProgress(state: OnboardingState): SectionProgress[] {
  const flow = new Set(buildFlow(state));
  const progress: SectionProgress[] = [];

  // Profile section: all steps from capability registries
  const profileStepIds: StepId[] = [];
  for (const capId of CAPABILITY_ORDER) {
    const cap = CAPABILITY_REGISTRY[capId];
    if (!cap.condition(state.capabilities, state)) continue;
    for (const stepId of cap.steps) {
      if (flow.has(stepId)) profileStepIds.push(stepId);
    }
  }

  if (profileStepIds.length > 0) {
    const completedCount = profileStepIds.filter((id) => {
      const step = STEP_REGISTRY[id];
      return step?.validate ? step.validate(state) : true;
    }).length;
    progress.push({
      id: 'base',
      label: 'Profile',
      total: profileStepIds.length,
      completed: completedCount,
      isComplete: completedCount === profileStepIds.length,
    });
  }

  // Assessment sections
  for (const sectionId of SECTION_ORDER) {
    const section = SECTION_REGISTRY[sectionId];
    const sectionStepIds = section.steps.filter((id) => flow.has(id));
    if (sectionStepIds.length === 0) continue;

    const completedCount = sectionStepIds.filter((id) => {
      const step = STEP_REGISTRY[id];
      return step?.validate ? step.validate(state) : true;
    }).length;

    progress.push({
      id: sectionId,
      label: section.shortLabel,
      total: sectionStepIds.length,
      completed: completedCount,
      isComplete: completedCount === sectionStepIds.length,
    });
  }

  return progress;
}
