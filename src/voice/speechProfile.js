import { assertKeys, assertStrings, frozenCopy, isNonEmptyString, requireValue } from '../shared/index.js';
export function createSpeechProfile(input) {
  assertKeys(input, ['userId', 'preferredLocale', 'preferredProvider', 'microphoneProfile', 'personalLexicon', 'recognitionCorrections', 'preferredOutputLanguage']);
  assertStrings(input, ['userId', 'preferredLocale', 'preferredProvider', 'microphoneProfile', 'preferredOutputLanguage']);
  requireValue(Array.isArray(input.personalLexicon) && input.personalLexicon.every(isNonEmptyString), 'Personal lexicon must contain terms');
  requireValue(Array.isArray(input.recognitionCorrections), 'Recognition corrections must be an array');
  for (const correction of input.recognitionCorrections) { assertKeys(correction, ['from', 'to']); assertStrings(correction, ['from', 'to']); }
  return frozenCopy({ ...input, simulationOnly: true });
}
