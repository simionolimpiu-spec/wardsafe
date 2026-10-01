import { assertActor, assertImplementsContract, assertReview, assertSimulationProvider, frozenCopy, isIsoTimestamp, isNonEmptyString, requireValue } from '../shared/index.js';
import { CommunicationProvider } from './communicationProvider.js';
import { COMMUNICATION_EVENT_KINDS } from './communicationEvent.js';
export function createSimulationCommunicationProvider() {
  const events = new Map();
  const delivery = new Map();
  const provider = Object.freeze({
    id: 'simulation-communication', mode: 'simulation', live: false, simulationOnly: true,
    capabilities: frozenCopy({ supportsDeliveryReceipts: true, supportsReadReceipts: true, supportsAttachments: false, supportsExternalChannels: false }),
    sendEvent(event) {
      requireValue(event?.channel === 'safeflow', 'channel not enabled in simulation');
      requireValue(event.simulationOnly === true && COMMUNICATION_EVENT_KINDS.includes(event.kind) && isNonEmptyString(event.id) && isNonEmptyString(event.threadId), 'Valid simulation event required');
      assertActor(event.author);
      requireValue(event.author.kind !== 'system' || event.kind === 'system-event', 'System cannot send clinical content');
      requireValue(event.status === 'ready' && event.reviewStatus === 'approved', 'Human approval required before sending');
      assertReview({ reviewedBy: event.approvedBy, reviewedAt: event.approvedAt });
      requireValue(!events.has(event.id), 'Event already sent');
      const sent = frozenCopy({ ...event, status: 'sent' });
      events.set(event.id, sent);
      return sent;
    },
    listThreadEvents(threadId) {
      requireValue(isNonEmptyString(threadId), 'Thread id required');
      return frozenCopy([...events.values()].filter((event) => event.threadId === threadId));
    },
    recordDeliveryState({ eventId, state, at }) {
      requireValue(events.has(eventId) && ['delivered', 'read'].includes(state) && isIsoTimestamp(at), 'Valid event delivery metadata required');
      const previous = delivery.get(eventId);
      requireValue(previous ? previous.state === 'delivered' && state === 'read' && new Date(at) >= new Date(previous.at) : state === 'delivered', 'Illegal delivery transition');
      const record = frozenCopy({ eventId, state, at, simulationOnly: true });
      delivery.set(eventId, record);
      return record;
    }
  });
  assertSimulationProvider(provider);
  return assertImplementsContract(provider, CommunicationProvider);
}
