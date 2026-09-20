import { describe, expect, it } from 'vitest';
import { createAgentSession, SESSION_STATUSES } from './index.js';

function session() {
  let id = 0;
  return createAgentSession({ patientId: 'DCU-031', workspaceId: 'simulation' }, {
    now: () => '2026-06-17T14:00:00.000Z', createId: () => `id-${++id}`
  });
}
const eventInput = { eventType: 'SIGNAL_DETECTED', actor: { kind: 'deterministic-engine', ref: 'simulation-rules' }, payload: { text: 'Simulation review cue' }, correlationId: 'correlation-1' };

describe('append-only sessions', () => {
  it('preserves five appends in order with owned session and sequence ids', () => {
    const handle = session();
    const snapshot = handle.getEvents();
    const events = Array.from({ length: 5 }, (_, index) => handle.append({ ...eventInput, payload: { index }, sessionId: 'other-session', sequence: 99 }));
    expect(handle.getEvents()).toEqual(events);
    expect(events.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(events.map(({ eventId }) => eventId)).toEqual(['id-2', 'id-3', 'id-4', 'id-5', 'id-6']);
    expect(events.map(({ payload }) => payload.index)).toEqual([0, 1, 2, 3, 4]);
    expect(events.every(({ sessionId }) => sessionId === handle.id)).toBe(true);
    expect(snapshot).toEqual([]);
    const copy = handle.getEvents();
    expect(copy).not.toBe(handle.getEvents());
    expect(Object.isFrozen(copy)).toBe(true);
    expect(() => copy.pop()).toThrow();
    expect(() => { copy[0].payload.index = 50; }).toThrow();
    expect(handle.getEvents()).toEqual(events);
  });
  it('exposes immutable session metadata and no destructive methods', () => {
    const handle = session();
    expect(Object.isFrozen(handle)).toBe(true);
    expect(handle).toMatchObject({ id: 'id-1', patientId: 'DCU-031', workspaceId: 'simulation', createdAt: '2026-06-17T14:00:00.000Z', simulationOnly: true });
    expect(() => { handle.id = 'other'; }).toThrow();
    for (const method of ['delete', 'update', 'splice', 'clear']) expect(handle[method]).toBeUndefined();
    expect(Object.isFrozen(SESSION_STATUSES)).toBe(true);
  });
  it.each(['completed', 'cancelled', 'error'])('makes %s terminal', (status) => {
    const handle = session();
    handle.append(eventInput);
    handle.transition(status);
    expect(handle.getStatus()).toBe(status);
    expect(() => handle.append(eventInput)).toThrow();
    for (const next of SESSION_STATUSES) expect(() => handle.transition(next)).toThrow();
    expect(handle.getEvents()).toHaveLength(1);
  });
  it.each(['completed', 'cancelled', 'error'])('allows awaiting-human-review to %s', (status) => {
    const handle = session();
    handle.transition('awaiting-human-review');
    handle.append(eventInput);
    handle.transition(status);
    expect(handle.getStatus()).toBe(status);
  });
  it('rejects illegal transitions without changing status', () => {
    const handle = session();
    for (const next of ['unknown', 'open', '__proto__']) expect(() => handle.transition(next)).toThrow();
    expect(handle.getStatus()).toBe('open');
    handle.transition('awaiting-human-review');
    expect(() => handle.transition('open')).toThrow();
    expect(handle.getStatus()).toBe('awaiting-human-review');
  });
  it('keeps sequence contiguous after a rejected append', () => {
    const handle = session();
    expect(() => handle.append({ ...eventInput, eventType: 'UNKNOWN' })).toThrow();
    expect(handle.getEvents()).toEqual([]);
    expect(handle.append(eventInput).sequence).toBe(1);
  });
});
