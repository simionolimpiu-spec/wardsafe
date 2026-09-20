import { expect, it } from 'vitest';
import { authenticateClinician, availablePointOfCareActions, bindPatient, createPointOfCareSession, endSession, evaluateInactivity, POINT_OF_CARE_ACTIONS, recordActivity } from './pointOfCareSession.js';
const at = '2026-09-20T12:00:00Z';
const patients = [{ id: 'fictional-patient', simulatedWristbandId: 'fictional-band', fictional: true, wardId: 'fictional-ward', bedId: 'fictional-bed' }];
const binding = { patientId: 'fictional-patient', simulatedWristbandId: 'fictional-band', patients, at };
const make = () => createPointOfCareSession({ deviceId: 'fictional-terminal' }, { now: () => at, createId: () => 'session-1' });
const auth = (session) => authenticateClinician(session, { method: 'simulated-badge', clinicianId: 'fictional-nurse', clinicianRole: 'senior-nurse', at });
it('cannot bind before authentication and wrong wristband never changes the session', () => {
  const locked = make();
  expect(() => bindPatient(locked, binding)).toThrow('authentication');
  const authenticated = auth(locked);
  expect(() => bindPatient(authenticated, { ...binding, simulatedWristbandId: 'wrong' })).toThrow('mismatch');
  expect(authenticated.patientId).toBeNull();
  expect(authenticated.status).toBe('clinician-authenticated');
  expect(() => bindPatient(authenticated, { ...binding, patients: [...patients, ...patients] })).toThrow();
});
it('refuses every non-simulated authentication method and gates actions on patient binding', () => {
  const locked = make();
  expect(() => authenticateClinician(locked, { method: 'badge', clinicianId: 'n', clinicianRole: 'nurse', at })).toThrow('not available in simulation');
  expect(availablePointOfCareActions(locked)).toEqual([]);
  const authenticated = auth(locked);
  expect(availablePointOfCareActions(authenticated)).toEqual([]);
  expect(availablePointOfCareActions(bindPatient(authenticated, binding))).toEqual(POINT_OF_CARE_ACTIONS);
});
it('inactivity locks exactly at timeout and clears patient and clinician context', () => {
  const bound = bindPatient(auth(make()), binding);
  expect(evaluateInactivity(bound, { now: () => '2026-09-20T12:00:59Z', timeoutMs: 60000 }).status).toBe('patient-bound');
  const locked = evaluateInactivity(bound, { now: () => '2026-09-20T12:01:00Z', timeoutMs: 60000 });
  expect(locked).toMatchObject({ status: 'locked', patientId: null, patientBoundAt: null, wardId: null, bedId: null, clinicianId: null });
  expect(bound.patientId).toBe('fictional-patient');
  expect(availablePointOfCareActions(locked)).toEqual([]);
});
it('activity is chronological and ending clears binding without allowing restart', () => {
  const bound = bindPatient(auth(make()), binding);
  const active = recordActivity(bound, { at: '2026-09-20T12:00:30Z' });
  expect(evaluateInactivity(active, { now: () => '2026-09-20T12:01:00Z', timeoutMs: 60000 }).status).toBe('patient-bound');
  expect(() => recordActivity(active, { at })).toThrow();
  const ended = endSession(active, { at: '2026-09-20T12:01:00Z' });
  expect(ended).toMatchObject({ status: 'ended', patientId: null, wardId: null, bedId: null });
  expect(() => auth(ended)).toThrow();
  expect(availablePointOfCareActions(ended)).toEqual([]);
});
