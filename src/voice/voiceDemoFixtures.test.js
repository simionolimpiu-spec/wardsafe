import { expect, it } from 'vitest';
import { currentUser, staffNames } from '../connect/demoFixtures.js';
import { createSimulationSpeechRecognitionProvider } from './index.js';
import { createVoiceReviewer, voiceOutputSamples, voiceScriptOptions } from './voiceDemoFixtures.js';

it('reuses the existing fictional identity through injection without a pillar import', () => {
  expect(createVoiceReviewer(currentUser, staffNames)).toEqual({ actor: currentUser, name: 'Alex Morgan' });
  expect(() => createVoiceReviewer({ kind: 'system', id: 's' }, { s: 'System' })).toThrow();
  expect(() => createVoiceReviewer(currentUser, {})).toThrow('name required');
});
it('offers exactly the fixed provider scripts and fictional output samples', () => {
  const provider = createSimulationSpeechRecognitionProvider({ now: () => '2026-10-11T09:00:00.000Z' });
  expect(voiceScriptOptions.map((item) => item.value)).toEqual(['clear', 'uncertain', 'numeric']);
  for (const { value } of voiceScriptOptions) expect(provider.recognise({ fixture: value }).simulationOnly).toBe(true);
  expect(Object.isFrozen(voiceScriptOptions[0])).toBe(true);
  for (const text of Object.values(voiceOutputSamples)) expect(text).toMatch(/fictional/i);
});
