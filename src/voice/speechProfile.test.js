import { expect, it } from 'vitest';
import { createSpeechProfile } from './speechProfile.js';
const profile = { userId: 'fictional-nurse', preferredLocale: 'en-GB', preferredProvider: 'simulation', microphoneProfile: 'simulated-directional', personalLexicon: ['SBAR'], recognitionCorrections: [{ from: 'willow', to: 'Fictional Willow Ward' }], preferredOutputLanguage: 'en-GB' };
it('stores editable preferences as independent frozen data without clinician evaluation', () => {
  const result = createSpeechProfile(profile);
  expect(result.simulationOnly).toBe(true);
  expect(result.recognitionCorrections).not.toBe(profile.recognitionCorrections);
  expect(Object.isFrozen(result.recognitionCorrections[0])).toBe(true);
});
it.each(['nationality', 'ethnicity', 'countryOfOrigin', 'accentOrigin', 'accentScore', 'accuracyScore', 'clinicianRating', 'accent-origin', 'unknown'])('rejects the %s profile key by name', (key) => {
  expect(() => createSpeechProfile({ ...profile, [key]: 'forbidden' })).toThrow(`Unknown key: ${key}`);
});
