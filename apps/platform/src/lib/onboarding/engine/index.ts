export {
  buildFlow,
  getStepPosition,
  getNextStepId,
  getPrevStepId,
  isLastStep,
  getSectionProgress,
} from './flow-builder';

export { validateStep, getInvalidSteps, isFlowComplete } from './validator';

export {
  migrateDraft,
  makeInitialState,
  mapLegacyStepId,
} from './draft-migration';

export { computeFlatData, flattenState } from './compat';

export {
  routePatch,
  ACCOMMODATION_FIELDS,
  TOURS_FIELDS,
  ACTIVITY_FIELDS,
  PILLAR1_FIELDS,
  PILLAR2_FIELDS,
  PILLAR3_FIELDS,
  EVIDENCE_FIELDS,
} from './field-router';
