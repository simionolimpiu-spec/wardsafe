import { expect, it } from 'vitest';
import { approveSpeechCandidate, createSpeechCandidate, SPEECH_CONFIDENCE_THRESHOLD, SPEECH_SAFE_FAILURE_MESSAGE } from './speechCandidate.js';
const input = { rawText: 'Original fictional words.', normalisedText: 'Original fictional words.', confidence: 0.95, alternatives: ['Alternative never selected.'], provider: 'simulation', locale: 'en-GB', capturedAt: '2026-09-20T12:00:00Z' };
const review = { reviewedBy: 'fictional-nurse', reviewedAt: '2026-09-20T12:01:00Z', editedText: 'Human edited fictional words.' };
it('retains raw text and alternatives unchanged after human approval with a separate edit', () => {
  const candidate = createSpeechCandidate(input);
  const approved = approveSpeechCandidate(candidate, review);
  expect(approved.rawText).toBe(input.rawText);
  expect(approved.normalisedText).toBe(input.normalisedText);
  expect(approved.editedText).toBe(review.editedText);
  expect(approved.alternatives).toEqual(input.alternatives);
  expect(candidate.reviewStatus).toBe('review-required');
  expect(candidate.provenance.humanConfirmed).toBe(false);
  expect(approved.provenance.humanConfirmed).toBe(true);
});
it.each([null, 0, 0.849])('fails safely for confidence %s without substituting an alternative', (confidence) => {
  const candidate = createSpeechCandidate({ ...input, confidence });
  expect(candidate.safeFailureMessage).toBe('SafeFlow could not reliably understand this input. Please repeat or enter it manually.');
  expect(candidate.safeFailureMessage).toBe(SPEECH_SAFE_FAILURE_MESSAGE);
  expect(candidate.reliability).toBe('unreliable');
  expect(candidate.rawText).toBe(input.rawText);
  expect(() => approveSpeechCandidate(candidate, review)).toThrow();
});
it('uses the declared threshold and rejects invalid confidence values', () => {
  expect(SPEECH_CONFIDENCE_THRESHOLD).toBe(0.85);
  expect(createSpeechCandidate({ ...input, confidence: 0.85 }).reliability).toBe('reviewable');
  for (const confidence of [-1, 1.01, NaN, '0.99', undefined]) expect(() => createSpeechCandidate({ ...input, confidence })).toThrow();
});
it('requires separate numeric confirmation even after transcript approval or numeric edits', () => {
  const candidate = createSpeechCandidate({ ...input, rawText: 'thirteen per minute' });
  expect(candidate).toMatchObject({ containsNumericContent: true, numericConfirmationRequired: true });
  expect(approveSpeechCandidate(candidate, review).numericConfirmationRequired).toBe(true);
  expect(approveSpeechCandidate(createSpeechCandidate(input), { ...review, editedText: '30 /min' }).numericConfirmationRequired).toBe(true);
});
