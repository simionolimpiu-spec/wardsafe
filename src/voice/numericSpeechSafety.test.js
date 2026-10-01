import { expect, it } from 'vitest';
import { confirmNumericValue, detectNumericContent } from './numericSpeechSafety.js';
it.each(['thirteen', '30', 'fourteen', '40', 'fifteen', '50', 'sixteen', '60', 'seventeen', '70', 'eighteen', '80', 'nineteen', '90'])('flags the teen/ty confusable %s for confirmation', (text) => {
  expect(detectNumericContent(text)).toMatchObject({ containsNumericContent: true, numericConfirmationRequired: true, confusables: [text], missingUnits: true });
});
it('detects decimal, negative and missing-unit risk without parsing observations', () => {
  expect(detectNumericContent('minus three point five')).toMatchObject({ decimals: true, negatives: true, missingUnits: true });
  expect(detectNumericContent('-3.5 L/min')).toMatchObject({ decimals: true, negatives: true, missingUnits: false });
  expect(detectNumericContent('30 /min and 40')).toMatchObject({ missingUnits: true });
  expect(detectNumericContent('No numbers here.').containsNumericContent).toBe(false);
});
it('requires unit and human review before marking a numeric value confirmed', () => {
  const input = { label: 'fictional rate', value: 30, unit: '/min', sourceSpan: 'thirty' };
  const review = { reviewedBy: 'fictional-nurse', reviewedAt: '2026-09-20T12:00:00Z' };
  expect(() => confirmNumericValue({ ...input, unit: '' }, review)).toThrow();
  expect(() => confirmNumericValue(input, {})).toThrow();
  expect(confirmNumericValue(input, review)).toMatchObject({ humanConfirmed: true, unit: '/min', sourceSpan: 'thirty' });
});
