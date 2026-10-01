import { assertImplementsContract, assertKeys, assertSimulationProvider, createCaptureProvenance, frozenCopy, idFrom, requireValue, timestampFrom } from '../../shared/index.js';
import { createObservationCandidate } from '../deviceObservation.js';
import { DeviceObservationProvider, DocumentCaptureProvider } from './contracts.js';
function provider(contract, capabilities, methods) {
  const value = Object.freeze({ id: `simulation-${contract.name}`, mode: 'simulation', live: false, simulationOnly: true, capabilities: frozenCopy(capabilities), ...methods });
  assertSimulationProvider(value);
  return assertImplementsContract(value, contract);
}
export function createSimulationDeviceObservationProvider({ now, createId } = {}) {
  requireValue(typeof now === 'function' && typeof createId === 'function', 'Injected clock and ID functions required');
  return provider(DeviceObservationProvider, { supportsStructuredObservations: true }, {
    readCandidates(input) {
      assertKeys(input, ['fixture']);
      requireValue(input.fixture === 'fictional-device-reading', 'Known fictional device fixture required');
      return frozenCopy([createObservationCandidate({ patientId: 'fictional-patient', code: 'simulation-respiratory-rate', value: 24, unit: '/min', source: { type: 'device', provider: 'simulation-device' } }, { now, createId })]);
    }
  });
}
export function createSimulationDocumentCaptureProvider({ now, createId } = {}) {
  requireValue(typeof now === 'function' && typeof createId === 'function', 'Injected clock and ID functions required');
  return provider(DocumentCaptureProvider, { supportsFixtureText: true }, {
    extractCandidates(input) {
      assertKeys(input, ['fixture']);
      requireValue(input.fixture === 'fictional-paper-note', 'Known fictional document fixture required');
      const originalText = 'Fictional ward handover note for review.';
      return frozenCopy([{ id: idFrom(createId), originalText, extractedText: originalText, reviewStatus: 'review-required', provenance: createCaptureProvenance({ type: 'scanned-document', provider: 'simulation-document', capturedAt: timestampFrom(now) }), simulationOnly: true }]);
    }
  });
}
