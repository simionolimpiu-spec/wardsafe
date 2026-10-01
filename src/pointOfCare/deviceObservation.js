import { assertKeys, assertStrings, confirmCaptureProvenance, createCaptureProvenance, frozenCopy, idFrom, requireValue, timestampFrom } from '../shared/index.js';
export function createObservationCandidate(input, { now, createId } = {}) {
  assertKeys(input, ['patientId', 'code', 'value', 'unit', 'source']);
  assertStrings(input, ['patientId', 'code', 'unit']);
  requireValue(typeof input.value === 'number' && Number.isFinite(input.value), 'Finite observation value required');
  assertKeys(input.source, ['type', 'provider']);
  requireValue(['device', 'manual', 'voice', 'simulation-fixture'].includes(input.source.type), 'Unsupported observation source');
  return frozenCopy({ ...input, id: idFrom(createId), provenance: createCaptureProvenance({ ...input.source, capturedAt: timestampFrom(now) }), reviewStatus: 'review-required', simulationOnly: true });
}
export function confirmObservationCandidate(candidate, review) {
  requireValue(candidate?.simulationOnly === true && candidate.reviewStatus === 'review-required', 'Unconfirmed observation candidate required');
  return frozenCopy({ ...candidate, provenance: confirmCaptureProvenance(candidate.provenance, review), reviewStatus: 'approved' });
}
