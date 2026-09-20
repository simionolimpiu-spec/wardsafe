import { assertKeys, assertStrings, frozenCopy, idFrom, requireValue, timestampFrom } from '../shared/index.js';
import { createRoleRecipient } from './roleRecipient.js';
export const THREAD_SCOPES = frozenCopy(['direct', 'team', 'mdt', 'patient', 'ward-service']);
export function createCommunicationThread(input, { now, createId } = {}) {
  assertKeys(input, ['scope', 'patientRef', 'participants']);
  requireValue(THREAD_SCOPES.includes(input.scope), 'Unknown thread scope');
  if (input.scope === 'patient') assertStrings(input, ['patientRef']);
  requireValue(Array.isArray(input.participants) && input.participants.length > 0, 'Participants required');
  for (const participant of input.participants) {
    if (participant?.kind === 'role') {
      assertKeys(participant, ['kind', 'roleKey', 'teamId', 'wardId', 'organisationId', 'simulationOnly']);
      createRoleRecipient({ roleKey: participant.roleKey, teamId: participant.teamId, wardId: participant.wardId, organisationId: participant.organisationId });
    } else {
      assertKeys(participant, ['kind', 'id', 'fictional', 'simulationOnly']);
      requireValue(participant.kind === 'person' && participant.fictional === true, 'Fictional person or role participant required');
      assertStrings(participant, ['id']);
    }
  }
  return frozenCopy({ ...input, patientRef: input.patientRef ?? null, id: idFrom(createId), createdAt: timestampFrom(now), simulationOnly: true });
}
