export class FoundationValidationError extends Error {
  constructor(message) { super(message); this.name = 'FoundationValidationError'; }
}

export function requireValue(condition, message) {
  if (!condition) throw new FoundationValidationError(message);
}
export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
export function isIsoTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value.replace(/(?<=:\d{2})Z$/, '.000Z');
}
export function timestampFrom(now) {
  requireValue(typeof now === 'function', 'Injected now function required');
  const value = now();
  const timestamp = value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : value;
  requireValue(isIsoTimestamp(timestamp), 'Valid ISO timestamp required');
  return timestamp;
}
export function idFrom(createId) {
  requireValue(typeof createId === 'function', 'Injected createId function required');
  const id = createId();
  requireValue(isNonEmptyString(id), 'Non-empty generated id required');
  return id;
}
export function assertKeys(value, keys) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype, 'Plain object required');
  for (const key of Reflect.ownKeys(value)) requireValue(keys.includes(key), `Unknown key: ${String(key)}`);
}
export function assertStrings(value, keys) {
  for (const key of keys) requireValue(isNonEmptyString(value[key]), `${key} required`);
}
export function assertActor(actor, humanOnly = false) {
  assertKeys(actor, ['kind', 'id']);
  assertStrings(actor, ['id']);
  requireValue((humanOnly ? ['human'] : ['human', 'system', 'ai-draft']).includes(actor.kind), 'Valid actor required; human action required for this transition');
}
export function assertReview({ reviewedBy, reviewedAt } = {}) {
  requireValue(isNonEmptyString(reviewedBy), 'Human reviewer required');
  requireValue(isIsoTimestamp(reviewedAt), 'Review ISO timestamp required');
}
export function frozenCopy(value, seen = new Set()) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number') { requireValue(Number.isFinite(value), 'Finite number required'); return value; }
  requireValue(typeof value === 'object' && !seen.has(value), 'Acyclic plain data required');
  requireValue(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype, 'Plain data required');
  seen.add(value);
  const copy = Array.isArray(value) ? value.map((item) => frozenCopy(item, seen)) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, frozenCopy(item, seen)]));
  seen.delete(value);
  return Object.freeze(copy);
}
