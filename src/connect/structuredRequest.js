import { assertActor, assertKeys, assertStrings, frozenCopy, idFrom, isIsoTimestamp, requireValue, timestampFrom } from '../shared/index.js';
export const STRUCTURED_REQUEST_TYPES = frozenCopy(['review-request', 'discharge-query', 'therapy-referral-request', 'medicines-query', 'information-request']);
export const REQUEST_TRANSITIONS = frozenCopy({ sent: ['delivered', 'cancelled'], delivered: ['read', 'cancelled'], read: ['acknowledged', 'declined', 'cancelled'], acknowledged: ['accepted', 'declined', 'cancelled'], accepted: ['in-progress', 'cancelled'], 'in-progress': ['completed', 'cancelled'], completed: [], declined: [], cancelled: [] });
export function createStructuredRequest(input, { now, createId } = {}) {
  assertKeys(input, ['type', 'threadId', 'actor']);
  requireValue(STRUCTURED_REQUEST_TYPES.includes(input.type), 'Unknown request type');
  assertStrings(input, ['threadId']);
  assertActor(input.actor, true);
  return frozenCopy({ ...input, id: idFrom(createId), state: 'sent', history: [{ to: 'sent', actor: input.actor, at: timestampFrom(now) }], simulationOnly: true });
}
export function transitionStructuredRequest(request, input) {
  assertKeys(input, ['to', 'actor', 'at']);
  requireValue(request?.simulationOnly === true && REQUEST_TRANSITIONS[request.state]?.includes(input.to), 'Illegal request transition');
  assertActor(input.actor, !['delivered', 'read'].includes(input.to));
  requireValue(isIsoTimestamp(input.at) && new Date(input.at) >= new Date(request.history.at(-1).at), 'Valid chronological transition time required');
  return frozenCopy({ ...request, state: input.to, history: [...request.history, input] });
}
