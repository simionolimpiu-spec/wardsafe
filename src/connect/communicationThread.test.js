import { expect, it } from 'vitest';
import { createCommunicationThread } from './communicationThread.js';
const deps = { now: () => '2026-09-20T12:00:00Z', createId: () => 'thread-1' };
const participants = [{ kind: 'person', id: 'fictional-person', fictional: true }];
it('requires patient reference for patient scope and validates participants', () => {
  expect(() => createCommunicationThread({ scope: 'patient', participants }, deps)).toThrow();
  const thread = createCommunicationThread({ scope: 'patient', participants, patientRef: 'fictional-patient' }, deps);
  expect(Object.isFrozen(thread.participants[0])).toBe(true);
  expect(() => createCommunicationThread({ scope: 'direct', participants: [{ kind: 'guess', id: 'p' }] }, deps)).toThrow();
  expect(() => createCommunicationThread({ scope: 'unknown', participants }, deps)).toThrow();
});
