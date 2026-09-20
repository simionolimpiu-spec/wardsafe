import { assertKeys, assertStrings, confirmCaptureProvenance, createCaptureProvenance, frozenCopy, isNonEmptyString, requireValue } from '../shared/index.js';
import { detectNumericContent } from './numericSpeechSafety.js';
export const SPEECH_CONFIDENCE_THRESHOLD = 0.85;
export const SPEECH_SAFE_FAILURE_MESSAGE = 'SafeFlow could not reliably understand this input. Please repeat or enter it manually.';
export function createSpeechCandidate(input) {
  assertKeys(input, ['rawText', 'normalisedText', 'confidence', 'alternatives', 'provider', 'locale', 'capturedAt']);
  assertStrings(input, ['rawText', 'normalisedText', 'provider', 'locale']);
  requireValue(input.confidence === null || (typeof input.confidence === 'number' && Number.isFinite(input.confidence) && input.confidence >= 0 && input.confidence <= 1), 'Confidence must be null or 0-1');
  requireValue(Array.isArray(input.alternatives) && input.alternatives.every(isNonEmptyString), 'Alternatives must be text');
  const unreliable = input.confidence === null || input.confidence < SPEECH_CONFIDENCE_THRESHOLD;
  const numericSafety = detectNumericContent(`${input.rawText} ${input.normalisedText}`);
  return frozenCopy({ ...input, editedText: null, reliability: unreliable ? 'unreliable' : 'reviewable', safeFailureMessage: unreliable ? SPEECH_SAFE_FAILURE_MESSAGE : null, reviewStatus: 'review-required', containsNumericContent: numericSafety.containsNumericContent, numericConfirmationRequired: numericSafety.numericConfirmationRequired, numericSafety, provenance: createCaptureProvenance({ type: 'voice', provider: input.provider, capturedAt: input.capturedAt }), simulationOnly: true });
}
export function approveSpeechCandidate(candidate, input) {
  assertKeys(input, ['reviewedBy', 'reviewedAt', 'editedText']);
  requireValue(candidate?.simulationOnly === true && candidate.reviewStatus === 'review-required' && candidate.confidence !== null && candidate.confidence >= SPEECH_CONFIDENCE_THRESHOLD && candidate.reliability === 'reviewable', 'Reliable unapproved candidate required');
  requireValue(input.editedText === undefined || isNonEmptyString(input.editedText), 'Edit must be non-empty text');
  const editedText = input.editedText ?? null;
  const numericSafety = detectNumericContent(`${candidate.rawText} ${candidate.normalisedText} ${editedText ?? ''}`);
  return frozenCopy({ ...candidate, editedText, numericSafety, containsNumericContent: numericSafety.containsNumericContent, numericConfirmationRequired: numericSafety.numericConfirmationRequired, reviewStatus: 'approved', provenance: confirmCaptureProvenance(candidate.provenance, { reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt }) });
}
