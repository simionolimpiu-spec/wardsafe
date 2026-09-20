import { expect, it } from 'vitest';
import { requiresHumanReview, REVIEW_STATUSES } from './reviewStatus.js';
it('distinguishes pending review from terminal outcomes without defaulting unknown states', () => {
  expect(REVIEW_STATUSES).toEqual(['draft', 'review-required', 'approved', 'rejected']);
  expect(REVIEW_STATUSES.map(requiresHumanReview)).toEqual([true, true, false, false]);
  expect(() => requiresHumanReview('sent')).toThrow();
});
