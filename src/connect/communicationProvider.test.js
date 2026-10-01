import { expect, it } from 'vitest';
import { CommunicationProvider } from './communicationProvider.js';
it('defines communication operations and explicit receipt, attachment and external-channel capabilities', () => {
  expect(CommunicationProvider.methods).toEqual(['sendEvent', 'listThreadEvents', 'recordDeliveryState']);
  expect(CommunicationProvider.capabilityKeys).toEqual(['supportsDeliveryReceipts', 'supportsReadReceipts', 'supportsAttachments', 'supportsExternalChannels']);
});
