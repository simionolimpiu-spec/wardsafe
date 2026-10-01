import {
  approveAiDraft,
  createCommunicationEvent,
  createStructuredRequest,
  transitionStructuredRequest,
  createSimulationCommunicationProvider
} from './index.js';
import {
  createCaptureProvenance,
  createPlatformEvent,
  FoundationValidationError,
  requireValue
} from '../shared/index.js';
import {
  createDemoFixtures,
  currentUser,
  draftTemplates,
  resolveDemoRecipient
} from './demoFixtures.js';

export function createConnectState({ patients = [], selectedPatientId } = {}) {
  const fixtures = createDemoFixtures(patients);
  const selectedThreadId = (
    fixtures.threads.find(
      (thread) => thread.patientRef === selectedPatientId
    ) ?? fixtures.threads[0]
  ).id;
  return {
    ...fixtures,
    selectedThreadId,
    requests: [],
    drafts: [],
    activity: [],
    composerText: '',
    announcement: '',
    notificationCategory: 'message',
    threads: fixtures.threads.map((thread) => ({
      ...thread,
      unread: thread.id === selectedThreadId ? 0 : thread.unread
    }))
  };
}

// Each reduction uses an isolated provider. Replaying an action in React Strict
// Mode has no external side effects, and sending still passes the provider gate.
export function connectReducer(state, action) {
  try {
    return reduceConnectAction(state, action);
  } catch (error) {
    if (!(error instanceof FoundationValidationError)) throw error;
    return { ...state, announcement: `Action refused: ${error.message}` };
  }
}

function reduceConnectAction(state, action) {
  const { type } = action;
  if (type === 'select-thread') {
    requireValue(
      state.threads.some((thread) => thread.id === action.threadId),
      'Unknown thread'
    );
    return {
      ...state,
      selectedThreadId: action.threadId,
      composerText: '',
      threads: state.threads.map((thread) =>
        thread.id === action.threadId ? { ...thread, unread: 0 } : thread
      )
    };
  }
  if (type === 'composer') return { ...state, composerText: action.text };
  const thread = state.threads.find(
    (item) => item.id === state.selectedThreadId
  );
  let sequence = 0;
  const deps = {
    now: () => action.at,
    createId: () => `${action.id}-${++sequence}`
  };
  const provider = createSimulationCommunicationProvider();
  const event = (kind, body, author = currentUser, reference) =>
    createCommunicationEvent(
      {
        kind,
        body,
        author,
        threadId: thread.id,
        channel: 'safeflow',
        ...(reference ? { reference } : {})
      },
      { ...deps, existingTaskIds: action.existingTaskIds ?? [] }
    );
  const record = (eventType, subject, actor = currentUser) =>
    createPlatformEvent(
      {
        type: eventType,
        actor,
        subjectRef: {
          kind: subject.kind ?? 'structured-request',
          id: subject.id
        },
        provenance: createCaptureProvenance({
          type: 'simulation-fixture',
          provider: provider.id,
          capturedAt: action.at
        })
      },
      deps
    );
  const recipient = () => {
    const result = resolveDemoRecipient(action.roleKey);
    requireValue(result.kind === 'person', result.reason);
    return result;
  };
  if (type === 'send-message') {
    const addressedTo = recipient();
    const sent = provider.sendEvent(
      event('message', state.composerText.trim())
    );
    return {
      ...state,
      events: [...state.events, { ...sent, recipientId: addressedTo.id }],
      composerText: '',
      activity: [
        ...state.activity,
        record('communication.messageCreated', sent)
      ],
      notificationCategory: 'message',
      announcement: 'Message sent in simulation'
    };
  }
  if (type === 'create-request') {
    const addressedTo = recipient();
    const sent = provider.sendEvent(
      event('structured-request', action.summary.trim())
    );
    const request = createStructuredRequest(
      { type: action.requestType, threadId: thread.id, actor: currentUser },
      deps
    );
    return {
      ...state,
      events: [...state.events, sent],
      requests: [
        ...state.requests,
        { ...request, eventId: sent.id, recipientId: addressedTo.id }
      ],
      activity: [
        ...state.activity,
        record('communication.requestCreated', request)
      ],
      notificationCategory: 'review-request',
      announcement: 'Request sent in simulation'
    };
  }
  if (type === 'transition-request') {
    const request = state.requests.find(
      (item) => item.id === action.requestId && item.threadId === thread.id
    );
    requireValue(request, 'Request not in selected thread');
    const actor = ['delivered', 'read'].includes(action.to)
      ? { kind: 'system', id: 'fictional-system' }
      : action.to === 'cancelled'
        ? currentUser
        : { kind: 'human', id: request.recipientId };
    const updated = transitionStructuredRequest(request, {
      to: action.to,
      actor,
      at: action.at
    });
    const platformType = {
      acknowledged: 'communication.acknowledged',
      accepted: 'communication.accepted',
      completed: 'communication.completed'
    }[action.to];
    const acknowledgement =
      action.to === 'acknowledged'
        ? provider.sendEvent(
            event(
              'acknowledgement',
              'Receipt acknowledged. Responsibility has not been accepted.',
              actor
            )
          )
        : null;
    return {
      ...state,
      requests: state.requests.map((item) =>
        item.id === request.id ? updated : item
      ),
      events: acknowledgement
        ? [...state.events, acknowledgement]
        : state.events,
      activity: platformType
        ? [...state.activity, record(platformType, request, actor)]
        : state.activity,
      notificationCategory:
        action.to === 'acknowledged'
          ? 'acknowledgement'
          : state.notificationCategory,
      announcement: `Request ${action.to}`
    };
  }
  if (type === 'draft') {
    const draft = event(
      'message',
      draftTemplates[state.events.length % draftTemplates.length],
      { kind: 'ai-draft', id: 'fictional-draft' }
    );
    return {
      ...state,
      drafts: [...state.drafts, draft],
      announcement: 'AI draft ready. Human review required'
    };
  }
  if (['approve-draft', 'discard-draft', 'edit-draft'].includes(type)) {
    const draft = state.drafts.find(
      (item) => item.id === action.draftId && item.threadId === thread.id
    );
    requireValue(draft, 'Draft not in selected thread');
    const drafts = state.drafts.filter((item) => item.id !== draft.id);
    if (type === 'discard-draft')
      return { ...state, drafts, announcement: 'Draft discarded' };
    if (type === 'edit-draft')
      return {
        ...state,
        drafts,
        composerText: draft.body,
        announcement: 'Draft copied to your message. Review and send manually'
      };
    const addressedTo = recipient();
    const sent = provider.sendEvent(
      approveAiDraft(draft, {
        approvedBy: currentUser.id,
        approvedAt: action.at
      })
    );
    return {
      ...state,
      drafts,
      events: [...state.events, { ...sent, recipientId: addressedTo.id }],
      activity: [
        ...state.activity,
        record('communication.messageCreated', sent)
      ],
      notificationCategory: 'message',
      announcement: 'Reviewed draft sent in simulation'
    };
  }
  if (type === 'link-task') {
    const sent = provider.sendEvent(
      event(
        'task-link',
        'Reference to an existing workspace task. Task unchanged.',
        currentUser,
        { taskId: action.taskId }
      )
    );
    return {
      ...state,
      events: [...state.events, sent],
      announcement: 'Existing task linked'
    };
  }
  return state;
}
