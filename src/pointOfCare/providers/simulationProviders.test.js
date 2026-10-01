import { expect, it } from 'vitest';
import { createSimulationDeviceObservationProvider, createSimulationDocumentCaptureProvider } from './simulationProviders.js';
const deps = { now: () => '2026-09-20T12:00:00Z', createId: () => 'candidate-1' };
it('returns device candidates only from a known fictional fixture', () => {
  const provider = createSimulationDeviceObservationProvider(deps);
  const result = provider.readCandidates({ fixture: 'fictional-device-reading' });
  expect(result[0]).toMatchObject({ reviewStatus: 'review-required', provenance: { type: 'device', humanConfirmed: false } });
  expect(() => provider.readCandidates({ fixture: 'live' })).toThrow();
});
it('extracts fixture text as review-required candidates without accepting external documents', () => {
  const provider = createSimulationDocumentCaptureProvider(deps);
  const result = provider.extractCandidates({ fixture: 'fictional-paper-note' });
  expect(result[0].originalText).toBe(result[0].extractedText);
  expect(result[0]).toMatchObject({ reviewStatus: 'review-required', provenance: { type: 'scanned-document', humanConfirmed: false } });
  expect(Object.isFrozen(result[0])).toBe(true);
  expect(() => provider.extractCandidates({ fixture: 'fictional-paper-note', upload: 'bytes' })).toThrow();
});
