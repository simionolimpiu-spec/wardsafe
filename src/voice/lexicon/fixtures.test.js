import { expect, it } from 'vitest';
import { fictionalLexiconLayers } from './fixtures.js';
it('keeps lexicon fixtures small and generic with explicit fictional ward wording', () => {
  expect(fictionalLexiconLayers.flatMap((layer) => layer.terms)).toHaveLength(5);
  expect(fictionalLexiconLayers.find((layer) => layer.layer === 'ward').terms[0].term).toContain('Fictional');
  expect(Object.isFrozen(fictionalLexiconLayers[0].terms)).toBe(true);
});
