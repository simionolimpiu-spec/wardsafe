import { assertActor, assertCaptureProvenance, assertKeys, frozenCopy, idFrom, isIsoTimestamp, isNonEmptyString, requireValue, timestampFrom } from '../shared/index.js';
export const VOICE_CAPTURE_TRANSITIONS = frozenCopy({ idle: ['listening', 'cancelled'], listening: ['processing', 'cancelled'], processing: ['transcript', 'cancelled'], transcript: ['draft-ready', 'cancelled'], 'draft-ready': ['review-required', 'cancelled'], 'review-required': ['saved', 'cancelled'], saved: [], cancelled: [] });
const AUDIO = frozenCopy({ retention: 'none', uploaded: false, realAudio: false });
function assertAmbient({ mode, location, policy, sensitiveContext }) {
  requireValue(['push-to-talk', 'ambient'].includes(mode), 'Unknown capture mode');
  requireValue(typeof sensitiveContext === 'boolean', 'Sensitive context must be explicit');
  assertKeys(location, ['type']);
  requireValue(['single-room', 'multi-bed-bay', 'other'].includes(location.type), 'Known location required');
  assertKeys(policy, ['ambientPermitted']);
  requireValue(typeof policy.ambientPermitted === 'boolean', 'Explicit ambient policy required');
  if (mode === 'ambient') requireValue(location.type === 'single-room' && policy.ambientPermitted === true && sensitiveContext !== true, 'Ambient capture not permitted in this context');
}
export function createVoiceCapture(input, { now, createId } = {}) {
  assertKeys(input, ['mode', 'location', 'policy', 'sensitiveContext']);
  const context = { mode: 'push-to-talk', sensitiveContext: false, ...input };
  assertAmbient(context);
  return frozenCopy({ ...context, id: idFrom(createId), state: 'idle', updatedAt: timestampFrom(now), audio: AUDIO, simulationOnly: true });
}
export function transitionVoiceCapture(capture, input) {
  assertKeys(input, ['to', 'action', 'actor', 'at', ...(input?.to === 'saved' ? ['approvedCandidate', 'confirmedNumericValues'] : [])]);
  requireValue(capture?.simulationOnly === true && VOICE_CAPTURE_TRANSITIONS[capture.state]?.includes(input.to), 'Illegal voice transition');
  assertAmbient(capture);
  requireValue(capture.audio?.retention === 'none' && capture.audio?.uploaded === false && capture.audio?.realAudio === false, 'Audio metadata cannot change');
  assertActor(input.actor, ['listening', 'saved', 'cancelled'].includes(input.to));
  if (input.to === 'listening') requireValue(input.action === 'start', 'Explicit human start required');
  let savedMetadata = {};
  if (input.to === 'saved') {
    requireValue(input.action === 'approve', 'Explicit human approval required');
    const candidate = input.approvedCandidate;
    requireValue(candidate?.simulationOnly === true && isNonEmptyString(candidate.rawText) && isNonEmptyString(candidate.normalisedText) && candidate.reviewStatus === 'approved' && candidate.reliability === 'reviewable', 'Approved reliable speech candidate required');
    assertCaptureProvenance(candidate.provenance);
    requireValue(candidate.provenance.humanConfirmed === true && candidate.provenance.reviewedBy === input.actor.id, 'Candidate must be human-confirmed by approving actor');
    const values = input.confirmedNumericValues ?? [];
    requireValue(Array.isArray(values) && values.every((value) => value?.humanConfirmed === true && isNonEmptyString(value.unit)), 'Confirmed numeric values with units required');
    requireValue(candidate.numericConfirmationRequired !== true || values.length > 0, 'Confirmed numeric values required');
    savedMetadata = { savedCandidateRef: { reviewedBy: candidate.provenance.reviewedBy, reviewedAt: candidate.provenance.reviewedAt }, confirmedNumericValueCount: values.length };
  }
  requireValue(isIsoTimestamp(input.at) && new Date(input.at) >= new Date(capture.updatedAt), 'Chronological voice transition time required');
  return frozenCopy({ ...capture, ...savedMetadata, state: input.to, updatedAt: input.at, lastActor: input.actor, audio: AUDIO });
}
