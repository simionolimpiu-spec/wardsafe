import { describe, expect, it } from 'vitest';
import { createAgentEvent, createGeneratedSummary, AgentEventError, AGENT_EVENT_TYPES, ACTOR_KINDS } from './index.js';

const now = () => '2026-06-17T14:00:00.000Z';
const dependencies = { now, createId: () => 'event-1' };
const input = { sessionId: 'session-1', eventType: 'SIGNAL_DETECTED', actor: { kind: 'deterministic-engine', ref: 'simulation-rules' }, payload: { cues: ['Review cue'] }, provenance: { source: 'simulation', simulationOnly: true }, correlationId: 'correlation-1', sequence: 1 };

describe('agent events', () => {
  it.each([{ eventType: 'UNKNOWN' }, { actor: { kind: 'unknown' } }, { actor: undefined }, { sessionId: '' }, { correlationId: undefined }, { sequence: 0 }])('rejects invalid event input %j', (change) => {
    expect(() => createAgentEvent({ ...input, ...change }, dependencies)).toThrow(AgentEventError);
  });
  it.each(['AI_REVIEW_GENERATED', 'SESSION_COMPACTED'])('enforces model identity and factory content for %s', (eventType) => {
    const payload = createGeneratedSummary({ text: 'Simulation review cue', model: 'simulation-model', sourceEventIds: [] }, { now });
    expect(() => createAgentEvent({ ...input, eventType, actor: { kind: 'human', ref: 'reviewer' }, payload }, dependencies)).toThrow(AgentEventError);
    for (const invalid of [{}, { ...payload }, { ...payload, trusted: true }]) {
      expect(() => createAgentEvent({ ...input, eventType, actor: { kind: 'ai-model' }, payload: invalid }, dependencies)).toThrow(AgentEventError);
    }
    const event = createAgentEvent({ ...input, eventType, actor: { kind: 'ai-model' }, payload }, dependencies);
    expect(event.payload).toBe(payload);
    expect(event.payload.trusted).toBe(false);
  });
  it.each(['HUMAN_REVIEW_COMPLETED', 'ACTION_RECORDED'])('requires a human actor for %s', (eventType) => {
    expect(() => createAgentEvent({ ...input, eventType }, dependencies)).toThrow(AgentEventError);
    expect(createAgentEvent({ ...input, eventType, actor: { kind: 'human', ref: 'reviewer' } }, dependencies).actor.kind).toBe('human');
  });
  it.each(['HUMAN_REVIEW_COMPLETED', 'ACTION_RECORDED', 'SIGNAL_DETECTED'])('requires an identified human actor for %s', (eventType) => {
    for (const ref of [undefined, null, '', '  ', 1]) {
      expect(() => createAgentEvent({ ...input, eventType, actor: { kind: 'human', ref } }, dependencies)).toThrow(AgentEventError);
    }
    expect(createAgentEvent({ ...input, eventType, actor: { kind: 'human', ref: 'reviewer' } }, dependencies).actor.ref).toBe('reviewer');
  });
  it('copies and deep-freezes event data without freezing caller inputs', () => {
    const mutable = JSON.parse(JSON.stringify(input));
    const event = createAgentEvent(mutable, dependencies);
    expect(event).toEqual({ ...input, eventId: 'event-1', timestamp: now(), simulationOnly: true });
    mutable.payload.cues.push('Another cue');
    expect(event.payload.cues).toEqual(['Review cue']);
    for (const value of [event, event.actor, event.payload, event.payload.cues, event.provenance, AGENT_EVENT_TYPES, ACTOR_KINDS]) expect(Object.isFrozen(value)).toBe(true);
    expect(() => event.payload.cues.push('changed')).toThrow();
  });
  it('rejects mutable exotic payload objects', () => {
    expect(() => createAgentEvent({ ...input, payload: new Map() }, dependencies)).toThrow(TypeError);
  });
});
