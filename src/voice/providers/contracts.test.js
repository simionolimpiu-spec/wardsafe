import { expect, it } from 'vitest';
import { SPEECH_OUTPUT_MODES, SpeechRecognitionProvider } from './contracts.js';
it('defines the exact recognition capabilities and private output choices', () => {
  expect(SpeechRecognitionProvider.capabilityKeys).toEqual(['supportedLocales', 'supportsLanguageIdentification', 'supportsCodeSwitching', 'supportsDiarisation', 'supportsCustomVocabulary', 'supportsCustomModels', 'supportsStreaming', 'supportsConfidence']);
  expect(SPEECH_OUTPUT_MODES).toEqual(['private', 'headset', 'device', 'disabled']);
});
