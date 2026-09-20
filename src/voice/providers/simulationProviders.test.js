import { expect, it } from 'vitest';
import { createSimulationAmbientDocumentationProvider, createSimulationClinicalSpeechLexiconProvider, createSimulationSpeechRecognitionProvider, createSimulationSpeechSynthesisProvider, createSimulationTranslationProvider } from './simulationProviders.js';
import { createVoiceCapture, transitionVoiceCapture } from '../voiceCaptureLifecycle.js';
const at = '2026-09-20T12:00:00Z';
const deps = { now: () => at, createId: () => 'capture-1' };
it('returns fixed fictional speech candidates including unreliable and numeric cases', () => {
  const provider = createSimulationSpeechRecognitionProvider(deps);
  expect(provider.recognise({ fixture: 'clear' })).toEqual(provider.recognise({ fixture: 'clear' }));
  expect(provider.recognise({ fixture: 'uncertain' }).reliability).toBe('unreliable');
  expect(provider.recognise({ fixture: 'numeric' }).numericConfirmationRequired).toBe(true);
  expect(() => provider.recognise({ fixture: 'arbitrary audio' })).toThrow();
  expect(() => provider.recognise({ fixture: 'clear', audio: 'bytes' })).toThrow();
});
it('refuses patient information in device mode and emits only synthesis metadata', () => {
  const provider = createSimulationSpeechSynthesisProvider();
  expect(() => provider.synthesise({ mode: 'device', containsPatientInformation: true })).toThrow();
  for (const mode of ['private', 'headset', 'disabled']) expect(provider.synthesise({ mode, containsPatientInformation: true }).audioProduced).toBe(false);
  expect(provider.synthesise({ mode: 'device', containsPatientInformation: false }).audioProduced).toBe(false);
  expect(() => provider.synthesise({ mode: 'device' })).toThrow();
});
it('requires a permitted explicitly started ambient session and returns an unconfirmed draft', () => {
  const provider = createSimulationAmbientDocumentationProvider(deps);
  let capture = createVoiceCapture({ mode: 'ambient', location: { type: 'single-room' }, policy: { ambientPermitted: true } }, deps);
  expect(() => provider.createDraft({ capture })).toThrow();
  const actor = { kind: 'human', id: 'fictional-nurse' };
  capture = transitionVoiceCapture(capture, { to: 'listening', action: 'start', actor, at });
  capture = transitionVoiceCapture(capture, { to: 'processing', action: 'stop', actor, at });
  expect(provider.createDraft({ capture })).toMatchObject({ reviewStatus: 'review-required', provenance: { type: 'ambient-draft', humanConfirmed: false } });
});
it('translates only fictional fixture text and returns layered lexicon provenance', () => {
  const provider = createSimulationTranslationProvider(deps);
  expect(provider.translate({ fixture: 'greeting', context: 'consent' }).professionalInterpreterRecommended).toBe(true);
  expect(() => provider.translate({ fixture: 'other', context: 'general' })).toThrow();
  expect(createSimulationClinicalSpeechLexiconProvider().getLexicon().entries.every((entry) => entry.sourceLayer)).toBe(true);
});
