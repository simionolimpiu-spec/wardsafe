import { expect, it } from 'vitest';
import * as shared from './index.js';
it('exposes capture provenance without colliding with the deferred agent provenance export', () => {
  expect(shared.createCaptureProvenance).toBeTypeOf('function');
  expect(shared.createProvenance).toBeUndefined();
  expect(shared.createPlatformEvent).toBeTypeOf('function');
});
