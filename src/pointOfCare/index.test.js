import { expect, it } from 'vitest';
import * as pointOfCare from './index.js';
it('exposes explicit session binding and candidate confirmation without scoring', () => {
  expect(pointOfCare.bindPatient).toBeTypeOf('function');
  expect(pointOfCare.confirmObservationCandidate).toBeTypeOf('function');
  expect(pointOfCare.calculateScore).toBeUndefined();
});
