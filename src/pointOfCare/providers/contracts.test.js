import { expect, it } from 'vitest';
import { DeviceObservationProvider, DocumentCaptureProvider } from './contracts.js';
it('offers only candidate capture methods, not automatic confirmation or export', () => {
  expect(DeviceObservationProvider.methods).toEqual(['readCandidates']);
  expect(DocumentCaptureProvider.methods).toEqual(['extractCandidates']);
});
