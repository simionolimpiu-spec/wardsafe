import { beforeEach, expect, it } from 'vitest';
import { currentUser, staffNames } from '../connect/demoFixtures.js';
import { createVoiceReviewer } from './voiceDemoFixtures.js';
import { createVoiceState, voiceReducer, voiceReviewStatus } from './voiceWorkspace.js';
import {
  approveSpeechCandidate, createVoiceCapture, createSimulationSpeechRecognitionProvider,
  SPEECH_SAFE_FAILURE_MESSAGE, transitionVoiceCapture, VOICE_CAPTURE_TRANSITIONS
} from './index.js';

let state;
let sequence;
const reviewer = createVoiceReviewer(currentUser, staffNames);
function action(type, values = {}) {
  sequence += 1;
  return { type, ...values, id: `test-${sequence}`, at: new Date(Date.UTC(2026, 9, 11, 9, sequence)).toISOString() };
}
function run(type, values) { state = voiceReducer(state, action(type, values)); return state; }
function ready(fixture = 'clear') { run('script', { fixture }); run('start'); run('stop'); }
function refused(type, values, reason) {
  const before = state;
  run(type, values);
  expect(state).toEqual({ ...before, announcement: `Action refused: ${reason}` });
  for (const key of ['capture', 'candidate', 'activity', 'trail', 'confirmedNumericValues']) expect(state[key]).toBe(before[key]);
}
const number = { label: 'Fictional value', value: 13, unit: '/min', sourceSpan: 'thirteen per minute' };
beforeEach(() => { sequence = 0; state = createVoiceState(reviewer); });

it('follows all Phase 1 transitions, never skips a state, and replays purely', () => {
  const start = action('start');
  const next = voiceReducer(state, start);
  expect(voiceReducer(state, start)).toEqual(next);
  expect(state.capture).toBeNull();
  state = next;
  run('stop');
  expect(state.trail).toEqual(['idle', 'listening', 'processing', 'transcript', 'draft-ready', 'review-required']);
  expect(voiceReviewStatus(state).disabledReason).toBe('');
  run('approve');
  expect(state.trail.at(-1)).toBe('saved');
  for (let i = 1; i < state.trail.length; i++) expect(VOICE_CAPTURE_TRANSITIONS[state.trail[i - 1]]).toContain(state.trail[i]);
  expect(state.capture.audio).toEqual({ retention: 'none', uploaded: false, realAudio: false });
});
it('refuses illegal moves without changing state or swallowing unexpected exceptions', () => {
  refused('stop', {}, 'Illegal voice transition');
  run('start');
  refused('start', {}, 'Illegal voice transition');
  refused('new', {}, 'Finish or cancel this dictation first');
  run('stop'); run('approve');
  refused('cancel', {}, 'Illegal voice transition');
  refused('start', {}, 'Illegal voice transition');
  expect(() => voiceReducer(state, { get type() { throw new Error('Programming error'); } })).toThrow('Programming error');
});
it('fails safe for uncertain speech even after an edit, and repeats with a new capture', () => {
  ready('uncertain');
  expect(state.candidate.safeFailureMessage).toBe(SPEECH_SAFE_FAILURE_MESSAGE);
  expect(state.announcement).toBe(SPEECH_SAFE_FAILURE_MESSAGE);
  run('edit', { text: 'A plausible replacement cannot approve unreliable input.' });
  refused('approve', {}, 'Reliable unapproved candidate required');
  const oldId = state.capture.id;
  run('repeat');
  expect(state.capture.state).toBe('listening');
  expect(state.capture.id).not.toBe(oldId);
  expect(state.candidate).toBeNull();
  expect(state.editedText).toBeNull();
  expect(state.activity.slice(-2).map((event) => event.type)).toEqual(['voice.captureStopped', 'voice.captureStarted']);
  expect(state.activity.at(-2).subjectRef.id).toBe(oldId);
});
it('requires numeric confirmation with a unit separately from transcript approval', () => {
  ready('numeric');
  expect(approveSpeechCandidate(state.candidate, { reviewedBy: currentUser.id, reviewedAt: state.capture.updatedAt }).numericConfirmationRequired).toBe(true);
  expect(voiceReviewStatus(state).disabledReason).toBe('Confirmed numeric values required');
  refused('approve', {}, 'Confirmed numeric values required');
  refused('confirm-number', { value: { ...number, unit: '' } }, 'unit required');
  refused('confirm-number', { value: { ...number, value: null } }, 'Finite numeric value required');
  run('confirm-number', { value: number });
  expect(state.confirmedNumericValues[0]).toMatchObject({ ...number, humanConfirmed: true, reviewedBy: currentUser.id });
  run('approve');
  expect(state.capture).toMatchObject({ state: 'saved', confirmedNumericValueCount: 1 });
});
it('includes numbers introduced by an edit, confusables, decimals, negatives and missing units', () => {
  ready();
  run('edit', { text: 'Fictional thirteen and thirty, minus three point five.' });
  expect(voiceReviewStatus(state).numericSafety).toMatchObject({
    numericConfirmationRequired: true, confusables: ['thirteen', 'thirty'], missingUnits: true, decimals: true, negatives: true
  });
  refused('approve', {}, 'Confirmed numeric values required');
  run('confirm-number', { value: number });
  run('edit', { text: 'Fictional thirty.' });
  expect(state.confirmedNumericValues).toEqual([]);
  refused('approve', {}, 'Confirmed numeric values required');
});
it.each(['clear', 'numeric'])('drops all transcript, edit and numeric source text when %s is saved', (fixture) => {
  ready(fixture);
  const raw = state.candidate.rawText;
  const edited = 'Fictional reviewed wording for this test.';
  run('edit', { text: edited });
  if (fixture === 'numeric') run('confirm-number', { value: number });
  run('approve');
  expect(state.capture.savedCandidateRef).toEqual({ reviewedBy: currentUser.id, reviewedAt: state.capture.updatedAt });
  expect(state.candidate).toBeNull();
  expect(state.editedText).toBeNull();
  expect(state.confirmedNumericValues).toEqual([]);
  const stored = JSON.stringify(state);
  const provider = createSimulationSpeechRecognitionProvider({ now: () => state.capture.updatedAt });
  for (const script of ['clear', 'uncertain', 'numeric']) expect(stored).not.toContain(provider.recognise({ fixture: script }).rawText);
  for (const text of [raw, edited, number.sourceSpan, number.label]) expect(stored).not.toContain(text);
  run('new');
  expect(state.capture).toBeNull();
  expect(state.trail).toEqual(['idle']);
});
it('keeps raw text immutable and refuses empty or non-string edits without a TypeError', () => {
  ready();
  const original = state.candidate;
  run('edit', { text: 'Separate fictional edit.' });
  expect(state.candidate).toBe(original);
  expect(state.editedText).toBe('Separate fictional edit.');
  for (const text of ['', '   ', null, undefined, 42, {}, []]) refused('edit', { text }, 'Edit must be non-empty text');
});
it.each(Object.keys(VOICE_CAPTURE_TRANSITIONS).filter((key) => VOICE_CAPTURE_TRANSITIONS[key].includes('cancelled')))(
  'cancels from %s, drops candidate data and records the stop', (status) => {
    const at = '2026-10-11T09:00:00.000Z';
    let capture = createVoiceCapture({ mode: 'push-to-talk', location: { type: 'other' }, policy: { ambientPermitted: false }, sensitiveContext: true }, { now: () => at, createId: () => 'capture' });
    const path = ['idle', 'listening', 'processing', 'transcript', 'draft-ready', 'review-required'];
    for (const to of path.slice(1, path.indexOf(status) + 1)) capture = transitionVoiceCapture(capture, { to, actor: currentUser, at, action: to === 'listening' ? 'start' : 'advance' });
    state = { ...state, capture, trail: path.slice(0, path.indexOf(status) + 1),
      candidate: createSimulationSpeechRecognitionProvider({ now: () => at }).recognise({ fixture: 'clear' }), editedText: 'Fictional edit' };
    run('cancel');
    expect(state.capture.state).toBe('cancelled');
    expect(state.candidate).toBeNull();
    expect(state.editedText).toBeNull();
    expect(state.announcement).toBe('Dictation cancelled. Nothing saved.');
    expect(state.activity.at(-1)).toMatchObject({ type: 'voice.captureStopped', actor: currentUser });
  }
);
it('also cancels before any capture is created', () => {
  run('cancel'); expect(state.trail).toEqual(['idle', 'cancelled']);
  run('new'); expect(state.capture).toBeNull();
});
it('records only references and human start/review actors', () => {
  ready(); run('approve');
  expect(state.activity.map((event) => event.type)).toEqual(['voice.captureStarted', 'voice.captureStopped', 'voice.transcriptionCreated', 'voice.draftReviewed']);
  for (const event of state.activity) {
    expect(Object.keys(event).sort()).toEqual(['type', 'actor', 'subjectRef', 'provenance', 'id', 'at', 'simulationOnly'].sort());
    expect(event.subjectRef).toEqual({ kind: 'voice-capture', id: state.capture.id });
    expect(JSON.stringify(event)).not.toMatch(/rawText|normalisedText|editedText|"transcript"|Fictional handover draft/);
  }
  for (const type of ['voice.captureStarted', 'voice.draftReviewed']) expect(state.activity.find((event) => event.type === type).actor).toEqual(currentUser);
});
it('delegates speech refusal to the provider and every successful preview produces metadata only', () => {
  run('output-settings', { mode: 'device', containsPatientInformation: true });
  refused('preview-output', {}, 'Patient information cannot use device output');
  for (const mode of ['private', 'headset', 'device', 'disabled']) {
    run('output-settings', { mode, containsPatientInformation: mode !== 'device' });
    run('preview-output');
    expect(state.outputResult).toEqual({ mode, audioProduced: false, disabled: mode === 'disabled', simulationOnly: true });
  }
  expect(state.announcement).toContain('Speech output is disabled');
});
it('validates context and locks script/context during capture', () => {
  run('context', { locationType: 'single-room', sensitiveContext: true });
  run('start');
  expect(state.capture).toMatchObject({ mode: 'push-to-talk', location: { type: 'single-room' }, sensitiveContext: true });
  refused('context', { locationType: 'other', sensitiveContext: false }, 'Capture context is fixed after starting');
  refused('script', { fixture: 'numeric' }, 'Script is fixed after starting');
});
