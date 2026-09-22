import { expect, it } from 'vitest';
import { createDemoFixtures, resolveDemoRecipient } from './demoFixtures.js';
it('seeds scenario-linked patient, team and MDT threads with fictional participants', () => {
  const patients = [
    { id: 'p-a', name: 'Fictional A' },
    { id: 'p-b', name: 'Fictional B' },
    { id: 'p-c', name: 'Fictional C' }
  ];
  const result = createDemoFixtures(patients);
  expect(result.threads.map((thread) => thread.scope)).toEqual([
    'patient',
    'patient',
    'team',
    'mdt'
  ]);
  expect(result.threads.slice(0, 2).map((thread) => thread.patientRef)).toEqual(
    ['p-a', 'p-b']
  );
  expect(
    result.events.every(
      (event) => event.simulationOnly && event.status === 'sent'
    )
  ).toBe(true);
  expect(createDemoFixtures(patients)).toEqual(result);
  expect(resolveDemoRecipient('senior-nurse').fictional).toBe(true);
  expect(resolveDemoRecipient('on-call')).toMatchObject({
    resolved: false,
    reason: 'No current available assignment'
  });
});

it('resolves the additional fictional pharmacist without changing the on-call gap', () => {
  expect(resolveDemoRecipient('pharmacist')).toMatchObject({
    id: 'fictional-pharmacist',
    fictional: true
  });
  expect(resolveDemoRecipient('on-call')).toMatchObject({ resolved: false });
});
