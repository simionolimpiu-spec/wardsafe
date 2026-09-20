import { expect, it } from 'vitest';
import { createRoleRecipient, resolveRoleRecipient, ROLE_KEYS } from './roleRecipient.js';
import { fictionalAssignments } from './fixtures.js';
const recipient = createRoleRecipient({ roleKey: 'senior-nurse', teamId: 'fictional-team', wardId: 'fictional-ward', organisationId: 'fictional-org' });
it('resolves only an exact, unique current available fictional assignment', () => {
  expect(resolveRoleRecipient(recipient, fictionalAssignments)).toEqual(fictionalAssignments[0].person);
  for (const assignments of [[], [...fictionalAssignments, ...fictionalAssignments], [{ ...fictionalAssignments[0], current: false }], [{ ...fictionalAssignments[0], wardId: 'other' }], [{ ...fictionalAssignments[0], available: false }]]) expect(resolveRoleRecipient(recipient, assignments).resolved).toBe(false);
});
it('validates the role taxonomy and rejects unknown roles', () => {
  expect(ROLE_KEYS).toHaveLength(8);
  expect(() => createRoleRecipient({ roleKey: 'guessed', teamId: 't', wardId: 'w', organisationId: 'o' })).toThrow();
});
