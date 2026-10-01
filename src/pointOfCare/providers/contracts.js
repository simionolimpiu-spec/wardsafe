import { defineProviderContract } from '../../shared/index.js';
export const DeviceObservationProvider = defineProviderContract({ name: 'DeviceObservationProvider', methods: ['readCandidates'], capabilityKeys: ['supportsStructuredObservations'] });
export const DocumentCaptureProvider = defineProviderContract({ name: 'DocumentCaptureProvider', methods: ['extractCandidates'], capabilityKeys: ['supportsFixtureText'] });
