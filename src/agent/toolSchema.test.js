import { describe, expect, it } from 'vitest';
import { validateAgainstSchema } from './index.js';

describe('small tool schema validator', () => {
  it.each([
    [{ type: 'string', minLength: 2, pattern: '^ab' }, 'abc', true],
    [{ type: 'string', minLength: 2 }, 'a', false],
    [{ type: 'string', pattern: '^ab' }, 'cab', false],
    [{ type: 'number', minimum: 0, maximum: 2 }, 0, true],
    [{ type: 'number', minimum: 0, maximum: 2 }, 3, false],
    [{ type: 'number' }, NaN, false],
    [{ type: 'number' }, Infinity, false],
    [{ type: 'boolean', enum: [true] }, false, false],
    [{ type: 'array', items: { type: 'string' } }, ['x', 1], false],
    [{ type: 'array', items: { type: 'string' } }, ['x'], true],
    [{ type: 'object' }, null, false],
    [{ type: 'object' }, [], false],
    [{ type: 'object' }, new Map(), false]
  ])('checks %j against %j', (schema, value, valid) => {
    const result = validateAgainstSchema(schema, value);
    expect(result.valid).toBe(valid);
    expect(result.errors.length === 0).toBe(valid);
  });
  it.each([{ type: 'null' }, { type: 'string', pattern: '[' }, { type: 'number', minimum: '1' }, { type: 'string', minLength: -1 }, { type: 'object', additionalProperties: true }, { type: 'object', required: ['missing'] }, { type: 'string', items: { type: 'number' } }, { type: 'number', minimum: 3, maximum: 1 }])('rejects malformed schema %j', (schema) => {
    expect(() => validateAgainstSchema(schema, null)).toThrow();
  });
});
