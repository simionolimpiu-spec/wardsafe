import { assertKeys, assertStrings, createCaptureProvenance, frozenCopy, requireValue } from '../shared/index.js';
export function createTranslationDraft(input) {
  assertKeys(input, ['originalText', 'originalLanguage', 'translatedText', 'targetLanguage', 'provider', 'confidence', 'context', 'capturedAt']);
  assertStrings(input, ['originalText', 'originalLanguage', 'translatedText', 'targetLanguage', 'provider']);
  requireValue(['general', 'consent', 'clinical-explanation', 'treatment-discussion', 'complex-decision'].includes(input.context), 'Known translation context required');
  requireValue(input.confidence === null || (typeof input.confidence === 'number' && Number.isFinite(input.confidence) && input.confidence >= 0 && input.confidence <= 1), 'Confidence must be null or 0-1');
  return frozenCopy({ ...input, reviewStatus: 'review-required', professionalInterpreterRecommended: input.context !== 'general', boundaryNote: 'Machine translation is not equivalent to professional interpreting. Human review required.', provenance: createCaptureProvenance({ type: 'simulation-fixture', provider: input.provider, capturedAt: input.capturedAt }), simulationOnly: true });
}
