import { beforeEach, expect, it } from 'vitest';
import { connectReducer, createConnectState } from './connectWorkspace.js';
import {
  createPrivacySafeNotification,
  createSimulationCommunicationProvider
} from './index.js';
import { currentUser } from './demoFixtures.js';
let state;
let sequence;
function action(type, values = {}) {
  sequence += 1;
  return {
    type,
    ...values,
    id: `test-${sequence}`,
    at: new Date(Date.UTC(2026, 8, 20, 10, sequence)).toISOString()
  };
}
function run(type, values) {
  state = connectReducer(state, action(type, values));
  return state;
}
function refused(type, values, message) {
  const previous = state;
  run(type, values);
  expect(state).toEqual({
    ...previous,
    announcement: `Action refused: ${message}`
  });
  for (const key of ['events', 'requests', 'drafts', 'activity'])
    expect(state[key]).toBe(previous[key]);
}
beforeEach(() => {
  sequence = 0;
  state = createConnectState({
    patients: [
      { id: 'patient-a', name: 'Fictional A' },
      { id: 'patient-b', name: 'Fictional B' }
    ]
  });
});
it('keeps urgent text a message, logs only references, and replays purely', () => {
  run('composer', { text: 'please escalate urgently' });
  const send = action('send-message', { roleKey: 'senior-nurse' });
  const result = connectReducer(state, send);
  expect(connectReducer(state, send)).toEqual(result);
  expect(state.events).toHaveLength(4);
  expect(result.events.at(-1)).toMatchObject({
    kind: 'message',
    body: 'please escalate urgently',
    status: 'sent'
  });
  for (const collection of ['tasks', 'escalations', 'cues'])
    expect(result).not.toHaveProperty(collection);
  expect(JSON.stringify(result.activity)).not.toContain(
    'please escalate urgently'
  );
});
it('fails closed for unresolved recipients and empty messages', () => {
  run('composer', { text: 'Review fictional handover' });
  refused(
    'send-message',
    { roleKey: 'on-call' },
    'No current available assignment'
  );
  run('composer', { text: '   ' });
  refused('send-message', { roleKey: 'senior-nurse' }, 'body required');
});
it('enforces every lifecycle step and distinct acknowledgement, acceptance and completion', () => {
  run('create-request', {
    roleKey: 'senior-nurse',
    requestType: 'review-request',
    summary: 'Fictional review'
  });
  const requestId = state.requests[0].id;
  refused(
    'transition-request',
    { requestId, to: 'completed' },
    'Illegal request transition'
  );
  for (const to of ['delivered', 'read', 'acknowledged'])
    run('transition-request', { requestId, to });
  expect(state.requests[0].state).toBe('acknowledged');
  expect(state.events.at(-1).kind).toBe('acknowledgement');
  expect(state.requests[0].history.at(-1).actor).toEqual({
    kind: 'human',
    id: 'fictional-nurse'
  });
  refused(
    'transition-request',
    { requestId, to: 'completed' },
    'Illegal request transition'
  );
  for (const to of ['accepted', 'in-progress', 'completed'])
    run('transition-request', { requestId, to });
  expect(state.requests[0].state).toBe('completed');
  refused(
    'transition-request',
    { requestId, to: 'cancelled' },
    'Illegal request transition'
  );
  expect(state.activity.map((event) => event.type)).toEqual([
    'communication.requestCreated',
    'communication.acknowledged',
    'communication.accepted',
    'communication.completed'
  ]);
});
it('cancels as the current human and rejects cross-thread actions', () => {
  run('create-request', {
    roleKey: 'senior-nurse',
    requestType: 'review-request',
    summary: 'Fictional review'
  });
  const requestId = state.requests[0].id;
  const first = state.selectedThreadId;
  run('select-thread', { threadId: state.threads[1].id });
  refused(
    'transition-request',
    { requestId, to: 'cancelled' },
    'Request not in selected thread'
  );
  run('select-thread', { threadId: first });
  run('transition-request', { requestId, to: 'cancelled' });
  expect(state.requests[0].history.at(-1).actor).toEqual(currentUser);
});
it('requires approval before the provider sends an AI draft', () => {
  run('draft');
  const draftId = state.drafts[0].id;
  expect(() =>
    createSimulationCommunicationProvider().sendEvent(state.drafts[0])
  ).toThrow('Human approval required');
  run('approve-draft', { draftId, roleKey: 'senior-nurse' });
  expect(state.drafts).toHaveLength(0);
  expect(state.events.at(-1)).toMatchObject({
    author: { kind: 'ai-draft' },
    approvedBy: currentUser.id,
    status: 'sent'
  });
});
it('discards drafts or lets the human edit and send under their own authorship', () => {
  run('draft');
  run('discard-draft', { draftId: state.drafts[0].id });
  expect(state.drafts).toHaveLength(0);
  run('draft');
  const body = state.drafts[0].body;
  run('edit-draft', { draftId: state.drafts[0].id });
  expect(state.composerText).toBe(body);
  run('send-message', { roleKey: 'senior-nurse' });
  expect(state.events.at(-1)).toMatchObject({ body, author: currentUser });
});
it('links only known task references', () => {
  refused(
    'link-task',
    { taskId: 'new-task', existingTaskIds: ['existing'] },
    'Existing task reference required'
  );
  run('link-task', { taskId: 'existing', existingTaskIds: ['existing'] });
  expect(state.events.at(-1)).toMatchObject({
    kind: 'task-link',
    reference: { taskId: 'existing' }
  });
});

it('does not hide unexpected programming errors', () => {
  expect(() =>
    run('create-request', { roleKey: 'senior-nurse', summary: null })
  ).toThrow(TypeError);
});
it('updates generic notification categories only for messages, new requests and acknowledgements', () => {
  run('create-request', {
    roleKey: 'pharmacist',
    requestType: 'review-request',
    summary: 'Fictional review'
  });
  const requestId = state.requests[0].id;
  expect(state.requests[0].recipientId).toBe('fictional-pharmacist');
  expect(state.notificationCategory).toBe('review-request');
  for (const to of ['delivered', 'read']) {
    run('transition-request', { requestId, to });
    expect(state.notificationCategory).toBe('review-request');
  }
  run('transition-request', { requestId, to: 'acknowledged' });
  expect(state.notificationCategory).toBe('acknowledgement');
  for (const to of ['accepted', 'in-progress', 'completed']) {
    run('transition-request', { requestId, to });
    expect(state.notificationCategory).toBe('acknowledgement');
  }
  run('composer', { text: 'Fictional message' });
  run('send-message', { roleKey: 'senior-nurse' });
  expect(state.notificationCategory).toBe('message');
  run('create-request', {
    roleKey: 'pharmacist',
    requestType: 'review-request',
    summary: 'Another review'
  });
  run('draft');
  run('approve-draft', { draftId: state.drafts[0].id, roleKey: 'pharmacist' });
  expect(state.notificationCategory).toBe('message');
  for (const category of ['message', 'review-request', 'acknowledgement']) {
    expect(createPrivacySafeNotification({ category }).text).not.toMatch(
      /Fictional|patient|Alex|Sam|Jordan|\d/
    );
  }
});
it.each(['declined', 'cancelled'])(
  '%s leaves notification category unchanged',
  (to) => {
    run('create-request', {
      roleKey: 'senior-nurse',
      requestType: 'review-request',
      summary: 'Review'
    });
    const requestId = state.requests[0].id;
    if (to === 'declined')
      for (const next of ['delivered', 'read'])
        run('transition-request', { requestId, to: next });
    run('transition-request', { requestId, to });
    expect(state.notificationCategory).toBe('review-request');
  }
);
