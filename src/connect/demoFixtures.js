import {
  createCommunicationThread,
  createCommunicationEvent,
  createRoleRecipient,
  resolveRoleRecipient,
  fictionalAssignments,
  createSimulationCommunicationProvider
} from './index.js';

export const currentUser = Object.freeze({
  kind: 'human',
  id: 'fictional-coordinator'
});
export const staffNames = Object.freeze({
  'fictional-coordinator': 'Alex Morgan',
  'fictional-nurse': 'Sam Taylor',
  'fictional-pharmacist': 'Jordan Lee',
  'fictional-draft': 'Simulation draft assistant',
  'fictional-system': 'Simulation service'
});
export const demoAssignments = Object.freeze([
  ...fictionalAssignments,
  Object.freeze({
    roleKey: 'pharmacist',
    teamId: 'fictional-team',
    wardId: 'fictional-ward',
    organisationId: 'fictional-org',
    current: true,
    available: true,
    person: Object.freeze({
      kind: 'person',
      id: 'fictional-pharmacist',
      fictional: true,
      simulationOnly: true
    })
  })
]);
export const draftTemplates = Object.freeze([
  'Please review the fictional handover information when available.',
  'Thank you. Please confirm the documentation review status.'
]);
export function recipientFor(roleKey) {
  return createRoleRecipient({
    roleKey,
    teamId: 'fictional-team',
    wardId: 'fictional-ward',
    organisationId: 'fictional-org'
  });
}
export function resolveDemoRecipient(roleKey) {
  return resolveRoleRecipient(recipientFor(roleKey), demoAssignments);
}
export function createDemoFixtures(patients = []) {
  let sequence = 0;
  const deps = {
    now: () => '2026-09-20T09:00:00.000Z',
    createId: () => `connect-seed-${++sequence}`
  };
  const participant = { kind: 'person', id: currentUser.id, fictional: true };
  const scopes = [
    ...patients.slice(0, 2).map((patient) => ({
      scope: 'patient',
      patientRef: patient.id,
      title: patient.name
    })),
    { scope: 'team', title: 'Ward nursing team' },
    { scope: 'mdt', title: 'MDT coordination' }
  ];
  const provider = createSimulationCommunicationProvider();
  const threads = scopes.map(({ title, ...input }) => ({
    ...createCommunicationThread(
      { ...input, participants: [participant, recipientFor('senior-nurse')] },
      deps
    ),
    title,
    unread: 1
  }));
  const events = threads.map((thread) =>
    provider.sendEvent(
      createCommunicationEvent(
        {
          kind: 'message',
          threadId: thread.id,
          channel: 'safeflow',
          author: { kind: 'human', id: 'fictional-nurse' },
          body: 'Fictional handover information is available for human review.'
        },
        deps
      )
    )
  );
  return { threads, events };
}
