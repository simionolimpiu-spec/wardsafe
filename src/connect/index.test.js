import { expect, it } from 'vitest';
import * as connect from './index.js';
it('exposes communication and role resolution without task creation', () => {
  expect(connect.createCommunicationThread).toBeTypeOf('function');
  expect(connect.resolveRoleRecipient).toBeTypeOf('function');
  expect(connect.createTask).toBeUndefined();
});
