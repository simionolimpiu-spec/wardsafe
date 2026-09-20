import { expect, it } from 'vitest';
import { createPrivacySafeNotification } from './notificationPayload.js';
it('emits only fixed generic text without patient names, identifiers, numbers or free text', () => {
  expect(createPrivacySafeNotification({ category: 'message' }).text).toBe('SafeFlow - new message');
  expect(createPrivacySafeNotification({ category: 'review-request' }).text).toBe('SafeFlow - new review request');
  for (const category of ['message', 'review-request', 'acknowledgement']) expect(createPrivacySafeNotification({ category }).text).not.toMatch(/\d|patient|fictional-person|patient-1/i);
  for (const key of ['text', 'body', 'patientId', 'patientName', 'value']) expect(() => createPrivacySafeNotification({ category: 'message', [key]: 'patient-1' })).toThrow('Unknown key');
  expect(() => createPrivacySafeNotification({ category: 'patient-1' })).toThrow();
});
