import { assertImplementsContract, assertKeys, assertSimulationProvider, createCaptureProvenance, frozenCopy, requireValue, timestampFrom } from '../../shared/index.js';
import { createSpeechCandidate } from '../speechCandidate.js';
import { createTranslationDraft } from '../translationDraft.js';
import { mergeLexiconLayers } from '../lexicon/clinicalSpeechLexicon.js';
import { fictionalLexiconLayers } from '../lexicon/fixtures.js';
import { AmbientDocumentationProvider, ClinicalSpeechLexiconProvider, SPEECH_OUTPUT_MODES, SpeechRecognitionProvider, SpeechSynthesisProvider, TranslationProvider } from './contracts.js';

function provider(contract, capabilities, methods) {
  const value = Object.freeze({ id: `simulation-${contract.name}`, mode: 'simulation', live: false, simulationOnly: true, capabilities: frozenCopy(capabilities), ...methods });
  assertSimulationProvider(value);
  return assertImplementsContract(value, contract);
}
export function createSimulationSpeechRecognitionProvider({ now } = {}) {
  requireValue(typeof now === 'function', 'Injected clock required');
  const scripts = frozenCopy({ clear: { text: 'Fictional handover draft for review.', confidence: 0.96 }, uncertain: { text: 'Unclear fictional input.', confidence: 0.4 }, numeric: { text: 'Fictional value thirteen per minute.', confidence: 0.92 } });
  return provider(SpeechRecognitionProvider, { supportedLocales: ['en-GB'], supportsLanguageIdentification: false, supportsCodeSwitching: false, supportsDiarisation: false, supportsCustomVocabulary: false, supportsCustomModels: false, supportsStreaming: false, supportsConfidence: true }, {
    recognise(input) {
      assertKeys(input, ['fixture']);
      requireValue(Object.hasOwn(scripts, input.fixture), 'Known fictional script required');
      const script = scripts[input.fixture];
      return createSpeechCandidate({ rawText: script.text, normalisedText: script.text, confidence: script.confidence, alternatives: [], provider: 'simulation-recognition', locale: 'en-GB', capturedAt: timestampFrom(now) });
    }
  });
}
export function createSimulationSpeechSynthesisProvider() {
  return provider(SpeechSynthesisProvider, { outputModes: SPEECH_OUTPUT_MODES }, {
    synthesise(input) {
      assertKeys(input, ['mode', 'containsPatientInformation']);
      requireValue(SPEECH_OUTPUT_MODES.includes(input.mode) && typeof input.containsPatientInformation === 'boolean', 'Explicit output mode and content classification required');
      requireValue(!(input.mode === 'device' && input.containsPatientInformation), 'Patient information cannot use device output');
      return frozenCopy({ mode: input.mode, audioProduced: false, disabled: input.mode === 'disabled', simulationOnly: true });
    }
  });
}
export function createSimulationAmbientDocumentationProvider({ now } = {}) {
  requireValue(typeof now === 'function', 'Injected clock required');
  return provider(AmbientDocumentationProvider, { supportsDiarisation: false }, {
    createDraft(input) {
      assertKeys(input, ['capture']);
      const capture = input.capture;
      requireValue(capture?.simulationOnly === true && capture.mode === 'ambient' && capture.state === 'processing' && capture.location?.type === 'single-room' && capture.policy?.ambientPermitted === true && capture.sensitiveContext === false && capture.audio?.realAudio === false && capture.audio?.uploaded === false && capture.audio?.retention === 'none', 'Explicit permitted simulated ambient capture required');
      return frozenCopy({ text: 'Fictional bedside discussion draft. Human review required.', reviewStatus: 'review-required', provenance: createCaptureProvenance({ type: 'ambient-draft', provider: 'simulation-ambient', capturedAt: timestampFrom(now) }), simulationOnly: true });
    }
  });
}
export function createSimulationTranslationProvider({ now } = {}) {
  requireValue(typeof now === 'function', 'Injected clock required');
  return provider(TranslationProvider, { supportedLocales: ['en-GB', 'fr-FR'] }, {
    translate(input) {
      assertKeys(input, ['fixture', 'context']);
      requireValue(input.fixture === 'greeting', 'Known fictional translation fixture required');
      return createTranslationDraft({ originalText: 'Hello from the fictional ward.', originalLanguage: 'en-GB', translatedText: 'Bonjour du service fictif.', targetLanguage: 'fr-FR', provider: 'simulation-translation', confidence: 0.95, context: input.context, capturedAt: timestampFrom(now) });
    }
  });
}
export function createSimulationClinicalSpeechLexiconProvider() {
  return provider(ClinicalSpeechLexiconProvider, { supportsCustomVocabulary: false }, { getLexicon() { return mergeLexiconLayers(fictionalLexiconLayers); } });
}
