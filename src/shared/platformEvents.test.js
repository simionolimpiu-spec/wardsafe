import { expect, it } from 'vitest';
import { createPlatformEvent, PLATFORM_EVENT_TYPES, HUMAN_ACTOR_EVENT_TYPES } from './platformEvents.js';
import { createCaptureProvenance, confirmCaptureProvenance } from './provenance.js';
const at = '2026-09-20T12:00:00Z';
const deps = { now: () => at, createId: () => 'event-1' };
const input = { type: 'voice.captureStarted', actor: { kind: 'human', id: 'fictional-nurse' }, subjectRef: { kind: 'capture', id: 'capture-1' }, provenance: createCaptureProvenance({ type: 'manual', provider: 'simulation', capturedAt: at }) };
const humanTypes = ['communication.acknowledged', 'communication.accepted', 'communication.completed', 'voice.captureStarted', 'voice.draftReviewed', 'pointOfCare.sessionStarted', 'pointOfCare.patientBound', 'observation.confirmed', 'documentation.approved'];
it('exports exactly the immutable human actor event types', () => {
  expect(HUMAN_ACTOR_EVENT_TYPES).toEqual(humanTypes);
  expect(Object.isFrozen(HUMAN_ACTOR_EVENT_TYPES)).toBe(true);
});
it.each(humanTypes)('%s requires a human actor', (type) => {
  const provenance = confirmCaptureProvenance(input.provenance, { reviewedBy: input.actor.id, reviewedAt: at });
  for (const kind of ['system', 'ai-draft']) expect(() => createPlatformEvent({ ...input, type, provenance, actor: { ...input.actor, kind } }, deps)).toThrow('human');
  expect(createPlatformEvent({ ...input, type, provenance }, deps).type).toBe(type);
});
it.each(['observation.confirmed', 'documentation.approved'])('%s requires confirmed provenance reviewed by its actor', (type) => {
  expect(() => createPlatformEvent({ ...input, type }, deps)).toThrow('Confirmed provenance');
  const provenance = confirmCaptureProvenance(input.provenance, { reviewedBy: 'other-human', reviewedAt: at });
  expect(() => createPlatformEvent({ ...input, type, provenance }, deps)).toThrow('Confirmed provenance');
});
it('still permits system metadata on events without a human-decision requirement', () => {
  expect(createPlatformEvent({ ...input, type: 'voice.transcriptionCreated', actor: { kind: 'system', id: 'simulation' } }, deps).provenance.humanConfirmed).toBe(false);
});
it('defines exactly the platform events and creates deterministic frozen reference metadata', () => {
  expect(PLATFORM_EVENT_TYPES).toEqual(['communication.messageCreated', 'communication.requestCreated', 'communication.acknowledged', 'communication.accepted', 'communication.completed', 'voice.captureStarted', 'voice.captureStopped', 'voice.transcriptionCreated', 'voice.draftReviewed', 'pointOfCare.sessionStarted', 'pointOfCare.patientBound', 'pointOfCare.sessionEnded', 'observation.draftCreated', 'observation.confirmed', 'documentation.draftCreated', 'documentation.approved']);
  expect(createPlatformEvent(input, deps)).toEqual(createPlatformEvent(input, deps));
  expect(Object.isFrozen(createPlatformEvent(input, deps).subjectRef)).toBe(true);
});
it('rejects unknown types and body/text/transcript at top level or nested metadata', () => {
  expect(() => createPlatformEvent({ ...input, type: 'communication.escalated' }, deps)).toThrow();
  for (const key of ['body', 'text', 'transcript']) {
    expect(() => createPlatformEvent({ ...input, [key]: 'secret' }, deps)).toThrow();
    for (const field of ['actor', 'subjectRef', 'provenance']) expect(() => createPlatformEvent({ ...input, [field]: { ...input[field], [key]: 'secret' } }, deps)).toThrow();
  }
});
