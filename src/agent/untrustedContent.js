import { frozenCopy, isNonEmptyString } from './domainValues.js';
import { TRUST_TIERS } from './trustTiers.js';

const branded = new WeakSet();
const kinds = ['clinical-free-text', 'retrieved-knowledge', 'imported-document', 'generated-summary'];

export function wrapUntrusted({ content, kind, source, sourceId }) {
  if (typeof content !== 'string' || !kinds.includes(kind)
    || !isNonEmptyString(source) || !isNonEmptyString(sourceId)) throw new TypeError('Invalid untrusted simulation content.');
  const item = frozenCopy({ content, kind, trustLevel: 'untrusted-data', source, sourceId, simulationOnly: true });
  branded.add(item);
  return item;
}

export function isUntrustedContent(item) {
  return branded.has(item);
}

// Internal adapter: source attribution does not confer instruction eligibility.
export function sourceContent(input) {
  const item = Object.freeze({ ...wrapUntrusted(input), trustTier: TRUST_TIERS.SOURCE_FACT });
  branded.add(item);
  return item;
}

// Snapshot ordinary data while retaining immutable factory identities.
export function copyToolOutput(value) {
  const copy = frozenCopy(value);
  function restore(original, snapshot) {
    if (isUntrustedContent(original)) return original;
    if (!snapshot || typeof snapshot !== 'object') return snapshot;
    return Object.freeze(Array.isArray(snapshot)
      ? snapshot.map((item, index) => restore(original[index], item))
      : Object.fromEntries(Object.keys(snapshot).map((key) => [key, restore(original[key], snapshot[key])])));
  }
  return restore(value, copy);
}
