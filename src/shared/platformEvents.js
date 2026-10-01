import { assertActor, assertKeys, assertStrings, frozenCopy, idFrom, requireValue, timestampFrom } from './domainValues.js';
import { assertCaptureProvenance } from './provenance.js';
export const PLATFORM_EVENT_TYPES = frozenCopy([
  'communication.messageCreated', 'communication.requestCreated', 'communication.acknowledged', 'communication.accepted', 'communication.completed',
  'voice.captureStarted', 'voice.captureStopped', 'voice.transcriptionCreated', 'voice.draftReviewed',
  'pointOfCare.sessionStarted', 'pointOfCare.patientBound', 'pointOfCare.sessionEnded',
  'observation.draftCreated', 'observation.confirmed', 'documentation.draftCreated', 'documentation.approved'
]);
export const HUMAN_ACTOR_EVENT_TYPES = frozenCopy([
  'communication.acknowledged', 'communication.accepted', 'communication.completed',
  'voice.captureStarted', 'voice.draftReviewed', 'pointOfCare.sessionStarted', 'pointOfCare.patientBound',
  'observation.confirmed', 'documentation.approved'
]);
export function createPlatformEvent(input, { now, createId } = {}) {
  assertKeys(input, ['type', 'actor', 'subjectRef', 'provenance']);
  requireValue(PLATFORM_EVENT_TYPES.includes(input.type), 'Unknown platform event type');
  assertActor(input.actor, HUMAN_ACTOR_EVENT_TYPES.includes(input.type));
  assertKeys(input.subjectRef, ['kind', 'id']);
  assertStrings(input.subjectRef, ['kind', 'id']);
  assertCaptureProvenance(input.provenance);
  if (['observation.confirmed', 'documentation.approved'].includes(input.type)) requireValue(input.provenance.humanConfirmed === true && input.provenance.reviewedBy === input.actor.id, 'Confirmed provenance reviewed by event actor required');
  return frozenCopy({ ...input, id: idFrom(createId), at: timestampFrom(now), simulationOnly: true });
}
