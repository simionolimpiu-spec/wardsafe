import { defineProviderContract, frozenCopy } from '../../shared/index.js';
export const SPEECH_OUTPUT_MODES = frozenCopy(['private', 'headset', 'device', 'disabled']);
export const SpeechRecognitionProvider = defineProviderContract({ name: 'SpeechRecognitionProvider', methods: ['recognise'], capabilityKeys: ['supportedLocales', 'supportsLanguageIdentification', 'supportsCodeSwitching', 'supportsDiarisation', 'supportsCustomVocabulary', 'supportsCustomModels', 'supportsStreaming', 'supportsConfidence'] });
export const SpeechSynthesisProvider = defineProviderContract({ name: 'SpeechSynthesisProvider', methods: ['synthesise'], capabilityKeys: ['outputModes'] });
export const AmbientDocumentationProvider = defineProviderContract({ name: 'AmbientDocumentationProvider', methods: ['createDraft'], capabilityKeys: ['supportsDiarisation'] });
export const TranslationProvider = defineProviderContract({ name: 'TranslationProvider', methods: ['translate'], capabilityKeys: ['supportedLocales'] });
export const ClinicalSpeechLexiconProvider = defineProviderContract({ name: 'ClinicalSpeechLexiconProvider', methods: ['getLexicon'], capabilityKeys: ['supportsCustomVocabulary'] });
