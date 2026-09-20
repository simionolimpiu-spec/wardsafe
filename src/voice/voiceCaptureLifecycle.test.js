import { expect, it } from 'vitest';
import { createVoiceCapture, transitionVoiceCapture } from './voiceCaptureLifecycle.js';
import { createSpeechCandidate, approveSpeechCandidate } from './speechCandidate.js';
import { confirmNumericValue } from './numericSpeechSafety.js';
const at = '2026-09-20T12:00:00Z';
const deps = { now: () => at, createId: () => 'capture-1' };
const context = { location: { type: 'multi-bed-bay' }, policy: { ambientPermitted: false } };
const human = { kind: 'human', id: 'fictional-nurse' };
const move = (capture, to, action = 'advance', actor = human) => transitionVoiceCapture(capture, { to, action, actor, at });
it('listens only after explicit human start and cannot save without explicit human approval', () => {
  let capture = createVoiceCapture(context, deps);
  expect(capture.mode).toBe('push-to-talk');
  expect(() => move(capture, 'listening')).toThrow('start');
  expect(() => move(capture, 'listening', 'start', { kind: 'system', id: 's' })).toThrow();
  expect(() => move(capture, 'saved', 'approve')).toThrow();
  capture = move(capture, 'listening', 'start');
  for (const to of ['processing', 'transcript', 'draft-ready', 'review-required']) capture = move(capture, to);
  expect(() => move(capture, 'saved')).toThrow('approval');
  expect(() => move(capture, 'saved', 'approve', { kind: 'system', id: 's' })).toThrow();
  expect(() => move(capture, 'saved', 'approve')).toThrow('candidate');
});
const candidate = (text = 'Fictional note') => createSpeechCandidate({ rawText: text, normalisedText: text, confidence: 0.95, alternatives: [], provider: 'simulation', locale: 'en-GB', capturedAt: at });
const approve = (value) => approveSpeechCandidate(value, { reviewedBy: human.id, reviewedAt: at });
function readyCapture() {
  let capture = move(createVoiceCapture(context, deps), 'listening', 'start');
  for (const to of ['processing', 'transcript', 'draft-ready', 'review-required']) capture = move(capture, to);
  return capture;
}
const save = (extra = {}) => transitionVoiceCapture(readyCapture(), { to: 'saved', action: 'approve', actor: human, at, ...extra });
it('refuses saving missing, unapproved, unreliable, unconfirmed or reviewer-mismatched candidates', () => {
  const approved = approve(candidate());
  for (const approvedCandidate of [undefined, candidate(), { ...approved, reliability: 'unreliable' }, { ...approved, provenance: candidate().provenance }, approveSpeechCandidate(candidate(), { reviewedBy: 'other-human', reviewedAt: at })]) expect(() => save({ approvedCandidate })).toThrow();
});
it('requires non-empty confirmed numeric values with units before saving numeric candidates', () => {
  const approvedCandidate = approve(candidate('RR 24 /min'));
  for (const confirmedNumericValues of [undefined, [], {}, [null], [{ humanConfirmed: false, unit: '/min' }], [{ humanConfirmed: true, unit: ' ' }]]) expect(() => save({ approvedCandidate, confirmedNumericValues })).toThrow('numeric');
  const value = confirmNumericValue({ label: 'RR', value: 24, unit: '/min', sourceSpan: '24 /min' }, { reviewedBy: human.id, reviewedAt: at });
  expect(save({ approvedCandidate, confirmedNumericValues: [value] })).toMatchObject({ state: 'saved', confirmedNumericValueCount: 1 });
});
it('saves only candidate review references and numeric count without transcript text', () => {
  const saved = save({ approvedCandidate: approve(candidate()) });
  expect(saved).toEqual({ ...readyCapture(), state: 'saved', savedCandidateRef: { reviewedBy: human.id, reviewedAt: at }, confirmedNumericValueCount: 0 });
  expect(Object.isFrozen(saved.savedCandidateRef)).toBe(true);
  expect(JSON.stringify(saved)).not.toContain('Fictional note');
});
it('accepts candidate and numeric confirmation inputs only on the saved transition', () => {
  for (const extra of [{ approvedCandidate: approve(candidate()) }, { confirmedNumericValues: [] }]) expect(() => transitionVoiceCapture(readyCapture(), { to: 'cancelled', actor: human, at, ...extra })).toThrow();
});
it('refuses ambient capture in bays, sensitive contexts and without explicit policy', () => {
  const allowed = { mode: 'ambient', location: { type: 'single-room' }, policy: { ambientPermitted: true }, sensitiveContext: false };
  for (const input of [{ ...allowed, location: { type: 'multi-bed-bay' } }, { ...allowed, sensitiveContext: true }, { ...allowed, policy: { ambientPermitted: false } }]) expect(() => createVoiceCapture(input, deps)).toThrow('Ambient');
  expect(createVoiceCapture(allowed, deps).mode).toBe('ambient');
});
it('fixes audio metadata to no retention and makes cancellation terminal', () => {
  const capture = createVoiceCapture(context, deps);
  expect(capture.audio).toEqual({ retention: 'none', uploaded: false, realAudio: false });
  expect(Object.isFrozen(capture.audio)).toBe(true);
  expect(() => createVoiceCapture({ ...context, audio: { realAudio: true } }, deps)).toThrow();
  expect(() => move({ ...capture, audio: { ...capture.audio, uploaded: true } }, 'listening', 'start')).toThrow();
  expect(() => move(move(capture, 'cancelled'), 'listening', 'start')).toThrow();
});
