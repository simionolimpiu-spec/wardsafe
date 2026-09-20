import { createAgentEvent } from './agentEvent.js';
import { isNonEmptyString, timestampFrom } from './domainValues.js';

export const SESSION_STATUSES = Object.freeze(['open', 'awaiting-human-review', 'completed', 'cancelled', 'error']);
const transitions = Object.freeze({
  open: Object.freeze(['awaiting-human-review', 'cancelled', 'error', 'completed']),
  'awaiting-human-review': Object.freeze(['completed', 'cancelled', 'error']),
  completed: Object.freeze([]), cancelled: Object.freeze([]), error: Object.freeze([])
});

export function createAgentSession({ patientId, workspaceId }, { now, createId }) {
  if (!isNonEmptyString(patientId) || !isNonEmptyString(workspaceId)) {
    throw new TypeError('Patient and workspace ids are required.');
  }
  const id = createId();
  if (!isNonEmptyString(id)) throw new TypeError('Session id is required.');
  const createdAt = timestampFrom(now);
  const events = [];
  let status = 'open';
  return Object.freeze({
    id, patientId, workspaceId, createdAt, simulationOnly: true,
    append({ eventType, actor, payload, provenance, correlationId }) {
      if (transitions[status].length === 0) throw new Error('Cannot append to a terminal simulation session.');
      const event = createAgentEvent({
        sessionId: id, sequence: events.length + 1, eventType, actor, payload, provenance, correlationId
      }, { now, createId });
      events.push(event);
      return event;
    },
    getEvents() {
      return Object.freeze([...events]);
    },
    getStatus() {
      return status;
    },
    transition(nextStatus) {
      if (!transitions[status].includes(nextStatus)) throw new Error('Illegal simulation session transition.');
      status = nextStatus;
      return status;
    }
  });
}
