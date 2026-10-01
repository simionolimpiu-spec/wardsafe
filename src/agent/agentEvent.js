import { frozenCopy, isNonEmptyString, timestampFrom } from './domainValues.js';
import { isGeneratedSummary } from './generatedContent.js';

export const AGENT_EVENT_TYPES = Object.freeze([
  'PATIENT_CONTEXT_REQUESTED', 'PATIENT_CONTEXT_LOADED', 'TOOL_CALL_REQUESTED',
  'TOOL_CALL_COMPLETED', 'SIGNAL_DETECTED', 'AI_REVIEW_REQUESTED', 'AI_REVIEW_GENERATED',
  'HUMAN_REVIEW_REQUIRED', 'HUMAN_REVIEW_COMPLETED', 'ACTION_RECORDED', 'SESSION_COMPACTED', 'ERROR'
]);
export const ACTOR_KINDS = Object.freeze(['system', 'deterministic-engine', 'tool', 'ai-model', 'human']);

export class AgentEventError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AgentEventError';
  }
}

export function createAgentEvent({ sessionId, eventType, actor, payload, provenance, correlationId, sequence }, { now, createId }) {
  if (!AGENT_EVENT_TYPES.includes(eventType)) throw new AgentEventError('Unknown agent event type.');
  if (!ACTOR_KINDS.includes(actor?.kind)) throw new AgentEventError('Unknown actor kind.');
  if (actor.kind === 'human' && !isNonEmptyString(actor.ref)) {
    throw new AgentEventError('Human actor reference is required.');
  }
  if (!isNonEmptyString(sessionId) || !isNonEmptyString(correlationId)) {
    throw new AgentEventError('Session and correlation ids are required.');
  }
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new AgentEventError('Sequence must be a positive integer.');
  const generated = eventType === 'AI_REVIEW_GENERATED' || eventType === 'SESSION_COMPACTED';
  if (generated && (actor.kind !== 'ai-model' || !isGeneratedSummary(payload))) {
    throw new AgentEventError('Generated events require a model actor and generated summary data.');
  }
  if (['HUMAN_REVIEW_COMPLETED', 'ACTION_RECORDED'].includes(eventType) && actor.kind !== 'human') {
    throw new AgentEventError('This event requires a human actor.');
  }
  const eventId = createId();
  if (!isNonEmptyString(eventId)) throw new AgentEventError('Event id is required.');
  const event = frozenCopy({
    eventId, sessionId, sequence, timestamp: timestampFrom(now), eventType,
    actor: { kind: actor.kind, ref: actor.ref }, payload, provenance, correlationId, simulationOnly: true
  });
  // Preserve the factory identity of immutable generated content for later review.
  return generated ? Object.freeze({ ...event, payload }) : event;
}
