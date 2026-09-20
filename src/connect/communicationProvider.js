import { defineProviderContract } from '../shared/index.js';
export const CommunicationProvider = defineProviderContract({ name: 'CommunicationProvider', methods: ['sendEvent', 'listThreadEvents', 'recordDeliveryState'], capabilityKeys: ['supportsDeliveryReceipts', 'supportsReadReceipts', 'supportsAttachments', 'supportsExternalChannels'] });
