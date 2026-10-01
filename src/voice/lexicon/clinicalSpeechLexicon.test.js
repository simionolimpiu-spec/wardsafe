import { expect, it } from 'vitest';
import { LEXICON_LAYERS, mergeLexiconLayers } from './clinicalSpeechLexicon.js';
it('merges in declared layer order and preserves duplicate terms with their source', () => {
  expect(LEXICON_LAYERS).toEqual(['general', 'nhs', 'trust', 'specialty', 'ward', 'patient-context', 'clinician-personal']);
  const result = mergeLexiconLayers([{ layer: 'ward', terms: [{ term: 'handover' }] }, { layer: 'general', terms: [{ term: 'handover' }] }]);
  expect(result.entries).toEqual([{ term: 'handover', sourceLayer: 'general' }, { term: 'handover', sourceLayer: 'ward' }]);
  expect(Object.isFrozen(result.entries[0])).toBe(true);
});
it('rejects layer deletion directives and unknown layers', () => {
  expect(() => mergeLexiconLayers([{ layer: 'ward', terms: [], delete: ['handover'] }])).toThrow();
  expect(() => mergeLexiconLayers([{ layer: 'unknown', terms: [] }])).toThrow();
});
