// SafeFlow design system public API (SF-295).
// Spec: docs/design/SAFeflow-DESIGN.md

export { Badge, BADGE_TONES } from './primitives/Badge.jsx';

export {
  CLINICAL_STATES,
  REVIEW_CATEGORY_LABELS,
  escalationStatus,
  getClinicalState,
  reviewCategoryLabel,
  reviewPriorityStatus,
  riskStatus,
  taskStatus
} from './clinical/clinicalStates.js';
export { ClinicalStatusBadge } from './clinical/ClinicalStatusBadge.jsx';
export { ClinicalValue, ObservationValue } from './clinical/ClinicalValue.jsx';
export {
  PatientAllergyStrip,
  PatientBanner,
  PatientContextStrip,
  PatientIdentityBlock
} from './clinical/PatientBanner.jsx';
export { EscalationState, SafetyStatus } from './clinical/SafetyStatus.jsx';
export { SimulationLabel } from './clinical/SimulationLabel.jsx';

export { InformationPanel } from './layout/InformationPanel.jsx';

export { EmptyState } from './feedback/EmptyState.jsx';
export {
  REVIEW_CUE_BOUNDARY,
  ReviewCue,
  ReviewCueEvidence,
  ReviewCueGroup,
  ReviewCueMetadata,
  ReviewCueRationale
} from './clinical/ReviewCue.jsx';
