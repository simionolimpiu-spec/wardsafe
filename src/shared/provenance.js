import { assertKeys, assertReview, assertStrings, frozenCopy, isIsoTimestamp, requireValue } from './domainValues.js';

export const PROVENANCE_SOURCE_TYPES = frozenCopy(['manual', 'voice', 'device', 'ambient-draft', 'imported', 'scanned-document', 'simulation-fixture']);
export function createCaptureProvenance(input) {
  assertKeys(input, ['type', 'provider', 'capturedAt']);
  assertStrings(input, ['provider']);
  requireValue(PROVENANCE_SOURCE_TYPES.includes(input.type), 'Unknown capture source');
  requireValue(isIsoTimestamp(input.capturedAt), 'Capture ISO timestamp required');
  return frozenCopy({ ...input, humanConfirmed: false, reviewedBy: null, reviewedAt: null, simulationOnly: true });
}
export function assertCaptureProvenance(value) {
  assertKeys(value, ['type', 'provider', 'capturedAt', 'humanConfirmed', 'reviewedBy', 'reviewedAt', 'simulationOnly']);
  createCaptureProvenance({ type: value.type, provider: value.provider, capturedAt: value.capturedAt });
  requireValue(value.simulationOnly === true && typeof value.humanConfirmed === 'boolean', 'Invalid capture provenance');
  if (value.humanConfirmed) assertReview(value);
  else requireValue(value.reviewedBy === null && value.reviewedAt === null, 'Unconfirmed provenance cannot carry review approval');
}
export function confirmCaptureProvenance(provenance, review) {
  assertCaptureProvenance(provenance);
  requireValue(!provenance.humanConfirmed, 'Capture already confirmed');
  assertKeys(review, ['reviewedBy', 'reviewedAt']);
  assertReview(review);
  requireValue(new Date(review.reviewedAt) >= new Date(provenance.capturedAt), 'Review precedes capture');
  return frozenCopy({ ...provenance, ...review, humanConfirmed: true });
}
