import { expect, it } from 'vitest';
import { createTranslationDraft } from './translationDraft.js';
const input = { originalText: 'Hello fictional ward.', originalLanguage: 'en-GB', translatedText: 'Bonjour service fictif.', targetLanguage: 'fr-FR', provider: 'simulation', confidence: 0.9, context: 'consent', capturedAt: '2026-09-20T12:00:00Z' };
it('preserves immutable original text and flags the professional interpreter pathway for consent', () => {
  const draft = createTranslationDraft(input);
  expect(draft.originalText).toBe(input.originalText);
  expect(draft.reviewStatus).toBe('review-required');
  expect(draft.professionalInterpreterRecommended).toBe(true);
  expect(draft.boundaryNote).toContain('not equivalent to professional interpreting');
  expect(() => { draft.originalText = 'changed'; }).toThrow();
});
it.each(['clinical-explanation', 'treatment-discussion', 'complex-decision'])('flags interpreter support for %s', (context) => expect(createTranslationDraft({ ...input, context }).professionalInterpreterRecommended).toBe(true));
it('refuses unknown contexts and invalid confidence', () => {
  expect(() => createTranslationDraft({ ...input, context: 'unknown' })).toThrow();
  expect(() => createTranslationDraft({ ...input, confidence: 2 })).toThrow();
});
