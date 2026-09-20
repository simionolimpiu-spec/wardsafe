import { assertKeys, assertStrings, frozenCopy, requireValue } from '../../shared/index.js';
export const LEXICON_LAYERS = frozenCopy(['general', 'nhs', 'trust', 'specialty', 'ward', 'patient-context', 'clinician-personal']);
export function mergeLexiconLayers(layers) {
  requireValue(Array.isArray(layers), 'Lexicon layers must be an array');
  const seen = new Set();
  for (const layer of layers) {
    assertKeys(layer, ['layer', 'terms']);
    requireValue(LEXICON_LAYERS.includes(layer.layer) && !seen.has(layer.layer), 'Unknown or duplicate lexicon layer');
    seen.add(layer.layer);
    requireValue(Array.isArray(layer.terms), 'Layer terms required');
    for (const entry of layer.terms) { assertKeys(entry, ['term']); assertStrings(entry, ['term']); }
  }
  return frozenCopy({ entries: LEXICON_LAYERS.flatMap((sourceLayer) => (layers.find((layer) => layer.layer === sourceLayer)?.terms ?? []).map((entry) => ({ ...entry, sourceLayer }))), simulationOnly: true });
}
