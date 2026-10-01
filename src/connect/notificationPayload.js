import { assertKeys, frozenCopy, requireValue } from '../shared/index.js';
const COPY = frozenCopy({ message: 'SafeFlow - new message', 'review-request': 'SafeFlow - new review request', acknowledgement: 'SafeFlow - request update' });
export function createPrivacySafeNotification(input) {
  assertKeys(input, ['category']);
  requireValue(Object.hasOwn(COPY, input.category), 'Unknown notification category');
  return frozenCopy({ category: input.category, text: COPY[input.category], simulationOnly: true });
}
