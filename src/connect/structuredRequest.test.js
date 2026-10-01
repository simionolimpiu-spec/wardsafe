import { expect, it } from 'vitest';
import { createStructuredRequest, transitionStructuredRequest } from './structuredRequest.js';
const at = '2026-09-20T12:00:00Z';
const actor = { kind: 'human', id: 'fictional-nurse' };
const make = () => createStructuredRequest({ type: 'review-request', threadId: 'thread-1', actor }, { now: () => at, createId: () => 'request-1' });
const move = (request, to) => transitionStructuredRequest(request, { to, actor, at });
it('requires human cancellation from every non-terminal state while system delivery and read remain allowed', () => {
  const system = { kind: 'system', id: 'system' };
  let request = make();
  for (const state of ['sent', 'delivered', 'read', 'acknowledged', 'accepted', 'in-progress']) {
    if (state !== 'sent') request = transitionStructuredRequest(request, { to: state, actor: ['delivered', 'read'].includes(state) ? system : actor, at });
    expect(request.state).toBe(state);
    expect(() => transitionStructuredRequest(request, { to: 'cancelled', actor: system, at })).toThrow('human');
    expect(move(request, 'cancelled').state).toBe('cancelled');
  }
});
it('acknowledged does not mean accepted and completion is only via in-progress', () => {
  let request = make();
  for (const state of ['delivered', 'read', 'acknowledged']) request = move(request, state);
  expect(request.state).toBe('acknowledged');
  expect(() => move(request, 'completed')).toThrow('Illegal');
  request = move(request, 'accepted');
  expect(() => move(request, 'completed')).toThrow('Illegal');
  expect(move(move(request, 'in-progress'), 'completed').state).toBe('completed');
});
it('requires human actors for meaningful transitions and keeps immutable history', () => {
  let request = make();
  for (const state of ['delivered', 'read', 'acknowledged', 'accepted', 'in-progress', 'completed']) {
    const before = request;
    if (!['delivered', 'read'].includes(state)) expect(() => transitionStructuredRequest(before, { to: state, actor: { kind: 'system', id: 'system' }, at })).toThrow('human');
    request = move(request, state);
    expect(request).not.toBe(before);
    expect(request.history).toHaveLength(before.history.length + 1);
    expect(Object.isFrozen(request.history)).toBe(true);
  }
  expect(() => move(request, 'sent')).toThrow();
});
it('decline and cancellation are terminal and never create tasks or cues', () => {
  const read = move(move(make(), 'delivered'), 'read');
  expect(() => transitionStructuredRequest(read, { to: 'declined', actor: { kind: 'system', id: 'system' }, at })).toThrow();
  for (const terminal of [move(read, 'declined'), move(make(), 'cancelled')]) {
    expect(() => move(terminal, 'accepted')).toThrow();
    expect(Object.keys(terminal).sort()).toEqual(['actor', 'history', 'id', 'simulationOnly', 'state', 'threadId', 'type']);
  }
});
