import { expect, it } from 'vitest';
import { confirmCaptureProvenance, createCaptureProvenance, PROVENANCE_SOURCE_TYPES } from './provenance.js';
const input = { type: 'device', provider: 'fictional-device', capturedAt: '2026-09-20T12:00:00Z' };
const review = { reviewedBy: 'fictional-nurse', reviewedAt: '2026-09-20T12:01:00Z' };
it('starts unconfirmed and frozen; confirmation creates a new frozen value', () => {
  const original = createCaptureProvenance(input);
  expect(original).toMatchObject({ humanConfirmed: false, reviewedBy: null, reviewedAt: null, simulationOnly: true });
  const confirmed = confirmCaptureProvenance(original, review);
  expect(confirmed).not.toBe(original);
  expect(confirmed.humanConfirmed).toBe(true);
  expect(original.humanConfirmed).toBe(false);
  expect(Object.isFrozen(original) && Object.isFrozen(confirmed)).toBe(true);
});
it('requires reviewer and time and rejects double or pre-capture confirmation', () => {
  const original = createCaptureProvenance(input);
  for (const invalid of [{}, { reviewedBy: 'nurse' }, { ...review, reviewedAt: 'invalid' }, { ...review, reviewedAt: '2026-09-19T00:00:00Z' }]) expect(() => confirmCaptureProvenance(original, invalid)).toThrow();
  expect(() => confirmCaptureProvenance(confirmCaptureProvenance(original, review), review)).toThrow('already confirmed');
  expect(() => createCaptureProvenance({ ...input, humanConfirmed: true })).toThrow('Unknown key');
});
it('accepts exactly the capture source taxonomy', () => {
  expect(PROVENANCE_SOURCE_TYPES).toEqual(['manual', 'voice', 'device', 'ambient-draft', 'imported', 'scanned-document', 'simulation-fixture']);
  expect(() => createCaptureProvenance({ ...input, type: 'guessed' })).toThrow();
});
