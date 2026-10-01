import { expect, it } from 'vitest';
import { confirmObservationCandidate, createObservationCandidate } from './deviceObservation.js';
const at = '2026-09-20T12:00:00Z';
const input = { patientId: 'fictional-patient', code: 'simulation-respiratory-rate', value: 24, unit: '/min', source: { type: 'device', provider: 'simulation-device' } };
const deps = { now: () => at, createId: () => 'observation-1' };
it('creates unconfirmed device provenance and computes no score or aggregate', () => {
  const candidate = createObservationCandidate(input, deps);
  expect(candidate).toMatchObject({ reviewStatus: 'review-required', provenance: { type: 'device', humanConfirmed: false } });
  expect(Object.keys(candidate).sort()).toEqual(['code', 'id', 'patientId', 'provenance', 'reviewStatus', 'simulationOnly', 'source', 'unit', 'value']);
  expect(Object.isFrozen(candidate.source)).toBe(true);
  expect(() => createObservationCandidate({ ...input, score: 2 }, deps)).toThrow();
});
it('requires human reviewer and timestamp for a separate immutable confirmation', () => {
  const candidate = createObservationCandidate(input, deps);
  expect(() => confirmObservationCandidate(candidate, {})).toThrow();
  const confirmed = confirmObservationCandidate(candidate, { reviewedBy: 'fictional-nurse', reviewedAt: at });
  expect(confirmed.provenance.humanConfirmed).toBe(true);
  expect(candidate.provenance.humanConfirmed).toBe(false);
  expect(() => confirmObservationCandidate(confirmed, { reviewedBy: 'nurse', reviewedAt: at })).toThrow();
});
it('rejects nonfinite values and missing units', () => {
  expect(() => createObservationCandidate({ ...input, value: NaN }, deps)).toThrow();
  expect(() => createObservationCandidate({ ...input, unit: '' }, deps)).toThrow();
});
