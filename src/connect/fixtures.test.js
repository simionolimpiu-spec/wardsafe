import { expect, it } from 'vitest';
import { fictionalAssignments } from './fixtures.js';
it('contains frozen fictional assignments only', () => {
  for (const assignment of fictionalAssignments) { expect(assignment.person.fictional).toBe(true); expect(Object.isFrozen(assignment.person)).toBe(true); }
});
