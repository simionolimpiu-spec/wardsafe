import { expect, it } from 'vitest';
import * as events from './communicationEvent.js';
const deps = { now: () => '2026-09-20T12:00:00Z', createId: () => 'event-1' };
const input = { kind: 'message', threadId: 'thread-1', channel: 'safeflow', author: { kind: 'human', id: 'fictional-nurse' }, body: 'please escalate urgently' };
it('keeps an urgent message a message and exports no implicit conversion', () => {
  expect(events.COMMUNICATION_EVENT_KINDS).toEqual(['message', 'structured-request', 'acknowledgement', 'task-link', 'system-event']);
  expect(Object.keys(events).sort()).toEqual(['COMMUNICATION_CHANNELS', 'COMMUNICATION_EVENT_KINDS', 'approveAiDraft', 'createCommunicationEvent']);
  const message = events.createCommunicationEvent(input, deps);
  expect(message.kind).toBe('message');
  expect(message.body).toBe(input.body);
  expect(message.reference).toBeNull();
  expect(message.task).toBeUndefined();
  expect(message.reviewCue).toBeUndefined();
  expect(message.escalation).toBeUndefined();
});
it('links only existing tasks and refuses non-safeflow channels', () => {
  const linked = { ...input, kind: 'task-link', reference: { taskId: 'task-1' } };
  expect(() => events.createCommunicationEvent(linked, deps)).toThrow('Existing task');
  expect(events.createCommunicationEvent(linked, { ...deps, existingTaskIds: ['task-1'] }).reference).toEqual({ taskId: 'task-1' });
  for (const channel of events.COMMUNICATION_CHANNELS.filter((value) => value !== 'safeflow')) expect(() => events.createCommunicationEvent({ ...input, channel }, deps)).toThrow('channel not enabled in simulation');
});
it('requires identified human review before changing AI draft to ready', () => {
  const draft = events.createCommunicationEvent({ ...input, author: { kind: 'ai-draft', id: 'simulation-draft' } }, deps);
  expect(draft).toMatchObject({ status: 'draft', reviewStatus: 'review-required' });
  expect(() => events.approveAiDraft(draft, {})).toThrow();
  expect(() => events.approveAiDraft(draft, { approvedBy: draft.author.id, approvedAt: '2026-09-20T12:01:00Z' })).toThrow('own draft');
  const approved = events.approveAiDraft(draft, { approvedBy: 'fictional-nurse', approvedAt: '2026-09-20T12:01:00Z' });
  expect(approved).toMatchObject({ status: 'ready', reviewStatus: 'approved' });
  expect(draft.status).toBe('draft');
  expect(() => events.approveAiDraft(approved, {})).toThrow();
});
