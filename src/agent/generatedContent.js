import { frozenCopy, isNonEmptyString, timestampFrom } from './domainValues.js';
import { TRUST_TIERS } from './trustTiers.js';
import { isInstructionEligible } from './systemInstruction.js';

export { isInstructionEligible } from './systemInstruction.js';

const generatedSummaries = new WeakSet();

export class GeneratedContentBoundaryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeneratedContentBoundaryError';
  }
}

export function createGeneratedSummary({ text, model, sourceEventIds, version = 1 }, { now }) {
  if (typeof text !== 'string' || typeof model !== 'string' || !model.trim()
    || !Array.isArray(sourceEventIds) || !sourceEventIds.every((id) => typeof id === 'string' && id.trim())
    || !Number.isInteger(version) || version < 1) {
    throw new TypeError('Invalid generated simulation summary.');
  }
  const summary = frozenCopy({
    type: 'ai_generated_summary', trusted: false, trustTier: TRUST_TIERS.AI_INTERPRETATION,
    origin: 'model-generated', model, generatedAt: timestampFrom(now), sourceEventIds, version,
    content: { text, trustLevel: 'untrusted-data' }, simulationOnly: true
  });
  generatedSummaries.add(summary);
  return summary;
}

export function createGeneratedReview({ model, providerId, sourceEventIds, review }, { now }) {
  if (!isNonEmptyString(model) || !isNonEmptyString(providerId)
    || !Array.isArray(sourceEventIds) || !sourceEventIds.every(isNonEmptyString)
    || !review || typeof review !== 'object' || Array.isArray(review)) {
    throw new TypeError('Invalid generated simulation review.');
  }
  const generated = frozenCopy({
    type: 'ai_generated_review', trusted: false, trustTier: TRUST_TIERS.AI_INTERPRETATION,
    origin: 'model-generated', model, providerId, generatedAt: timestampFrom(now), sourceEventIds,
    version: 1, content: { ...review, trustLevel: 'untrusted-data' }, simulationOnly: true
  });
  generatedSummaries.add(generated);
  return generated;
}

// Internal boundary check; intentionally not re-exported by the public barrel.
export function isGeneratedSummary(item) {
  return generatedSummaries.has(item);
}

export function assertNotUsedAsInstruction(item) {
  if (!isInstructionEligible(item)) {
    throw new GeneratedContentBoundaryError('Only factory-created system instructions are eligible for instruction use.');
  }
}
