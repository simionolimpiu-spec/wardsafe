import { frozenCopy, requireValue } from './domainValues.js';
export const REVIEW_STATUSES = frozenCopy(['draft', 'review-required', 'approved', 'rejected']);
export function requiresHumanReview(status) {
  requireValue(REVIEW_STATUSES.includes(status), 'Unknown review status');
  return status === 'draft' || status === 'review-required';
}
