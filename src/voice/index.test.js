import { expect, it } from 'vitest';
import * as voice from './index.js';
it('exposes reviewable speech and separate numeric confirmation without observation parsing', () => {
  expect(voice.createSpeechCandidate).toBeTypeOf('function');
  expect(voice.confirmNumericValue).toBeTypeOf('function');
  expect(voice.parseObservations).toBeUndefined();
});
