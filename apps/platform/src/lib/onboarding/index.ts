/**
 * Onboarding Engine — public API
 *
 * Import from here for all new code. The legacy onboarding-steps.ts
 * continues to serve existing step components during migration.
 */

export type {
  CapabilityId,
  SectionId,
  StepId,
  EvidenceTier,
  P3Status,
  BaseData,
  AccommodationData,
  ToursData,
  ActivityData,
  Pillar1Data,
  Pillar2Data,
  Pillar3Data,
  EvidenceData,
  OnboardingState,
  StepDefinition,
  CapabilityDefinition,
  SectionDefinition,
  SectionProgress,
} from './types';

export { deriveOperatorType, operatorTypeToCaps } from './types';

export { STEP_REGISTRY } from './registry/step-registry';
export { CAPABILITY_REGISTRY, CAPABILITY_ORDER } from './registry/capability-registry';
export { SECTION_REGISTRY, SECTION_ORDER } from './registry/section-registry';

export {
  buildFlow,
  getStepPosition,
  getNextStepId,
  getPrevStepId,
  isLastStep,
  getSectionProgress,
} from './engine/flow-builder';

export { validateStep, getInvalidSteps, isFlowComplete } from './engine/validator';

export {
  migrateDraft,
  makeInitialState,
  mapLegacyStepId,
} from './engine/draft-migration';

export { computeFlatData, flattenState } from './engine/compat';

export { routePatch } from './engine/field-router';
