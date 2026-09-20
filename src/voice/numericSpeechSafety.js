import { assertKeys, assertReview, assertStrings, frozenCopy, requireValue } from '../shared/index.js';
const NUMBER_WORDS = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|half|quarter)\b/gi;
const CONFUSABLES = /\b(?:13|30|14|40|15|50|16|60|17|70|18|80|19|90|thirteen|thirty|fourteen|forty|fifteen|fifty|sixteen|sixty|seventeen|seventy|eighteen|eighty|nineteen|ninety)\b/gi;
export function detectNumericContent(text) {
  requireValue(typeof text === 'string', 'Text required');
  const digitSpans = [...text.matchAll(/[-+]?\d+(?:\.\d+)?/g)];
  const wordSpans = [...text.matchAll(NUMBER_WORDS)];
  const spans = [...digitSpans, ...wordSpans].sort((a, b) => a.index - b.index);
  const containsNumericContent = spans.length > 0;
  // Conservative detection only: adjacent unit cues do not parse observations or confirm values.
  const missingUnits = spans.some((span) => !/^\s*(?:%|\/min\b|L\/min\b|mmHg\b|mg\b|mL\b|kg\b|cm\b|mmol\/L\b|bpm\b|degrees\b|percent\b|per minute\b)/i.test(text.slice(span.index + span[0].length)));
  return frozenCopy({ containsNumericContent, numericConfirmationRequired: containsNumericContent, confusables: [...text.matchAll(CONFUSABLES)].map((match) => match[0]), decimals: /\d\.\d|\bpoint\b/i.test(text) && containsNumericContent, negatives: /-\s*\d|\b(?:minus|negative)\b/i.test(text) && containsNumericContent, missingUnits, simulationOnly: true });
}
export function confirmNumericValue(input, review) {
  assertKeys(input, ['label', 'value', 'unit', 'sourceSpan']);
  assertStrings(input, ['label', 'unit', 'sourceSpan']);
  requireValue(typeof input.value === 'number' && Number.isFinite(input.value), 'Finite numeric value required');
  assertKeys(review, ['reviewedBy', 'reviewedAt']);
  assertReview(review);
  return frozenCopy({ ...input, ...review, humanConfirmed: true, simulationOnly: true });
}
