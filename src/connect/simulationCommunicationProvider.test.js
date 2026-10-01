import { expect, it } from 'vitest';
import { createSimulationCommunicationProvider } from './simulationCommunicationProvider.js';
import { approveAiDraft, createCommunicationEvent } from './communicationEvent.js';
const at = '2026-09-20T12:00:00Z';
const draft = () => createCommunicationEvent({ kind: 'message', threadId: 'thread-1', channel: 'safeflow', author: { kind: 'ai-draft', id: 'fictional-draft' }, body: 'Fictional review draft.' }, { now: () => at, createId: () => 'event-1' });
it('cannot send an AI draft until human approved; rejects external channels', () => {
  const provider = createSimulationCommunicationProvider();
  const event = draft();
  expect(() => provider.sendEvent(event)).toThrow('Human approval');
  const approved = approveAiDraft(event, { approvedBy: 'fictional-nurse', approvedAt: at });
  expect(() => provider.sendEvent({ ...approved, channel: 'teams' })).toThrow('channel not enabled in simulation');
  expect(provider.sendEvent(approved).status).toBe('sent');
  expect(event.status).toBe('draft');
  expect(() => provider.sendEvent(approved)).toThrow('already sent');
});
it('isolates instance stores and records only explicit delivery states', () => {
  const first = createSimulationCommunicationProvider();
  first.sendEvent(approveAiDraft(draft(), { approvedBy: 'fictional-nurse', approvedAt: at }));
  expect(first.listThreadEvents('thread-1')).toHaveLength(1);
  expect(createSimulationCommunicationProvider().listThreadEvents('thread-1')).toEqual([]);
  expect(() => first.recordDeliveryState({ eventId: 'event-1', state: 'read', at })).toThrow();
  expect(first.recordDeliveryState({ eventId: 'event-1', state: 'delivered', at }).state).toBe('delivered');
  expect(first.recordDeliveryState({ eventId: 'event-1', state: 'read', at }).state).toBe('read');
  expect(() => first.recordDeliveryState({ eventId: 'event-1', state: 'accepted', at })).toThrow();
});
