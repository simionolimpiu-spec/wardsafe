import { assertKeys, assertStrings, frozenCopy, idFrom, isIsoTimestamp, requireValue, timestampFrom } from '../shared/index.js';
export const POINT_OF_CARE_ACTIONS = frozenCopy(['record-observations', 'dictate-note', 'start-bedside-session', 'care-forms', 'tasks', 'communication']);
export const POINT_OF_CARE_STATUSES = frozenCopy(['locked', 'clinician-authenticated', 'patient-bound', 'ended']);
function assertSession(session) {
  requireValue(session?.simulationOnly === true && POINT_OF_CARE_STATUSES.includes(session.status) && isIsoTimestamp(session.lastActivityAt), 'Valid simulation session required');
}
function assertTime(session, at) {
  requireValue(isIsoTimestamp(at) && new Date(at) >= new Date(session.lastActivityAt), 'Chronological activity time required');
}
const clearedBinding = { patientId: null, wardId: null, bedId: null, patientBoundAt: null };
export function createPointOfCareSession(input, { now, createId } = {}) {
  assertKeys(input, ['deviceId']);
  assertStrings(input, ['deviceId']);
  return frozenCopy({ sessionId: idFrom(createId), clinicianId: null, clinicianRole: null, ...clearedBinding, deviceId: input.deviceId, authenticatedAt: null, lastActivityAt: timestampFrom(now), status: 'locked', simulationOnly: true });
}
export function authenticateClinician(session, input) {
  assertSession(session);
  assertKeys(input, ['method', 'clinicianId', 'clinicianRole', 'at']);
  requireValue(input.method === 'simulated-badge', 'not available in simulation');
  requireValue(session.status === 'locked', 'Locked session required');
  assertStrings(input, ['clinicianId', 'clinicianRole']);
  assertTime(session, input.at);
  return frozenCopy({ ...session, clinicianId: input.clinicianId, clinicianRole: input.clinicianRole, authenticatedAt: input.at, lastActivityAt: input.at, status: 'clinician-authenticated' });
}
export function bindPatient(session, input) {
  assertSession(session);
  assertKeys(input, ['patientId', 'simulatedWristbandId', 'patients', 'at']);
  requireValue(session.status === 'clinician-authenticated', 'Clinician authentication required before patient binding');
  assertStrings(input, ['patientId', 'simulatedWristbandId']);
  requireValue(Array.isArray(input.patients), 'Fictional patient lookup required');
  const matches = input.patients.filter((patient) => patient?.simulatedWristbandId === input.simulatedWristbandId);
  requireValue(matches.length === 1 && matches[0].id === input.patientId && matches[0].fictional === true, 'Wristband mismatch or ambiguous fictional patient');
  const patient = matches[0];
  assertStrings(patient, ['wardId', 'bedId']);
  assertTime(session, input.at);
  return frozenCopy({ ...session, patientId: patient.id, wardId: patient.wardId, bedId: patient.bedId, patientBoundAt: input.at, lastActivityAt: input.at, status: 'patient-bound' });
}
export function recordActivity(session, { at } = {}) {
  assertSession(session);
  requireValue(['clinician-authenticated', 'patient-bound'].includes(session.status), 'Active session required');
  assertTime(session, at);
  return frozenCopy({ ...session, lastActivityAt: at });
}
export function evaluateInactivity(session, { now, timeoutMs } = {}) {
  assertSession(session);
  requireValue(Number.isFinite(timeoutMs) && timeoutMs > 0, 'Positive inactivity timeout required');
  const at = timestampFrom(now);
  assertTime(session, at);
  if (['locked', 'ended'].includes(session.status) || new Date(at) - new Date(session.lastActivityAt) < timeoutMs) return frozenCopy(session);
  return frozenCopy({ ...session, ...clearedBinding, clinicianId: null, clinicianRole: null, authenticatedAt: null, status: 'locked', lastActivityAt: at });
}
export function endSession(session, { at } = {}) {
  assertSession(session);
  requireValue(session.status !== 'ended', 'Session already ended');
  assertTime(session, at);
  return frozenCopy({ ...session, ...clearedBinding, clinicianId: null, clinicianRole: null, authenticatedAt: null, status: 'ended', lastActivityAt: at });
}
export function availablePointOfCareActions(session) {
  assertSession(session);
  return session.status === 'patient-bound' && session.patientId && session.clinicianId ? POINT_OF_CARE_ACTIONS : frozenCopy([]);
}
