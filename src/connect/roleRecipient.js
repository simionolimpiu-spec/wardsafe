import { assertKeys, assertStrings, frozenCopy, requireValue } from '../shared/index.js';
export const ROLE_KEYS = frozenCopy(['medical-team', 'pharmacist', 'physiotherapist', 'occupational-therapist', 'discharge-coordinator', 'senior-nurse', 'clinical-educator', 'on-call']);
export function createRoleRecipient(input) {
  assertKeys(input, ['roleKey', 'teamId', 'wardId', 'organisationId']);
  assertStrings(input, ['teamId', 'wardId', 'organisationId']);
  requireValue(ROLE_KEYS.includes(input.roleKey), 'Unknown role');
  return frozenCopy({ ...input, kind: 'role', simulationOnly: true });
}
export function resolveRoleRecipient(recipient, assignments) {
  createRoleRecipient({ roleKey: recipient?.roleKey, teamId: recipient?.teamId, wardId: recipient?.wardId, organisationId: recipient?.organisationId });
  requireValue(Array.isArray(assignments), 'Assignments must be an array');
  const matches = assignments.filter((item) => item?.current === true && item?.available === true && ['roleKey', 'teamId', 'wardId', 'organisationId'].every((key) => item[key] === recipient[key]));
  if (matches.length !== 1) return frozenCopy({ resolved: false, reason: matches.length ? 'Ambiguous current assignment' : 'No current available assignment', simulationOnly: true });
  const person = matches[0].person;
  requireValue(person?.kind === 'person' && person?.fictional === true, 'Fictional person required');
  assertStrings(person, ['id']);
  return frozenCopy(person);
}
