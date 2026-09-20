import { describe, expect, it } from 'vitest';
import { FoundationValidationError, frozenCopy, idFrom, isIsoTimestamp, isNonEmptyString, timestampFrom } from './domainValues.js';
describe('domain values', () => {
  it('copies deeply without freezing caller data', () => {
    const source = { items: [{ value: 1 }] };
    const copy = frozenCopy(source);
    source.items[0].value = 2;
    expect(copy.items[0].value).toBe(1);
    expect(Object.isFrozen(copy.items[0])).toBe(true);
    expect(Object.isFrozen(source)).toBe(false);
  });
  it('rejects non-plain, cyclic and nonfinite data with named errors', () => {
    const cyclic = {}; cyclic.self = cyclic;
    for (const value of [cyclic, new Date(), () => {}, NaN, undefined]) expect(() => frozenCopy(value)).toThrow(FoundationValidationError);
  });
  it('validates calendar timestamps and injected clock and IDs', () => {
    expect(isIsoTimestamp('2026-02-30T12:00:00Z')).toBe(false);
    expect(isIsoTimestamp('2026-09-20T12:00:00Z')).toBe(true);
    expect(timestampFrom(() => new Date('2026-09-20T12:00:00Z'))).toBe('2026-09-20T12:00:00.000Z');
    expect(() => timestampFrom()).toThrow(FoundationValidationError);
    expect(() => idFrom(() => '')).toThrow(FoundationValidationError);
    expect(isNonEmptyString('  ')).toBe(false);
  });
});
