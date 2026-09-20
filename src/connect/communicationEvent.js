import { assertActor, assertKeys, assertReview, assertStrings, frozenCopy, idFrom, isIsoTimestamp, requireValue, timestampFrom } from '../shared/index.js';
export const COMMUNICATION_EVENT_KINDS = frozenCopy(['message', 'structured-request', 'acknowledgement', 'task-link', 'system-event']);
export const COMMUNICATION_CHANNELS = frozenCopy(['safeflow', 'teams', 'nhs-notify', 'email', 'sms', 'push', 'whatsapp', 'voice']);
export function createCommunicationEvent(input, { now, createId, existingTaskIds = [] } = {}) {
  assertKeys(input, ['kind', 'threadId', 'channel', 'author', 'body', 'reference']);
  requireValue(COMMUNICATION_EVENT_KINDS.includes(input.kind), 'Unknown communication kind');
  requireValue(input.channel === 'safeflow', 'channel not enabled in simulation');
  assertStrings(input, ['threadId', 'body']);
  assertActor(input.author);
  requireValue(input.author.kind !== 'system' || input.kind === 'system-event', 'Human author or reviewed draft required');
  if (input.kind === 'task-link') {
    assertKeys(input.reference, ['taskId']);
    assertStrings(input.reference, ['taskId']);
    requireValue(Array.isArray(existingTaskIds) && existingTaskIds.includes(input.reference.taskId), 'Existing task reference required');
  } else requireValue(input.reference === undefined || input.reference === null, 'Reference allowed only for task-link');
  const draft = input.author.kind === 'ai-draft';
  const createdAt = timestampFrom(now);
  return frozenCopy({ ...input, reference: input.reference ?? null, id: idFrom(createId), createdAt, status: draft ? 'draft' : 'ready', reviewStatus: draft ? 'review-required' : 'approved', approvedBy: draft ? null : input.author.id, approvedAt: draft ? null : createdAt, simulationOnly: true });
}
export function approveAiDraft(event, input) {
  assertKeys(input, ['approvedBy', 'approvedAt']);
  requireValue(event?.simulationOnly === true && event.author?.kind === 'ai-draft' && event.status === 'draft' && event.reviewStatus === 'review-required', 'Unapproved AI draft required');
  assertReview({ reviewedBy: input.approvedBy, reviewedAt: input.approvedAt });
  requireValue(input.approvedBy !== event.author.id, 'AI draft author cannot approve its own draft');
  requireValue(isIsoTimestamp(event.createdAt) && new Date(input.approvedAt) >= new Date(event.createdAt), 'Approval precedes creation');
  return frozenCopy({ ...event, ...input, status: 'ready', reviewStatus: 'approved' });
}
