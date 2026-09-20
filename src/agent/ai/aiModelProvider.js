import { frozenCopy, isNonEmptyString } from '../domainValues.js';
import { createGeneratedReview } from '../generatedContent.js';
import { parseAndValidateReview, ReviewResponseError } from './reviewResponse.js';

export class ProviderPolicyError extends Error {
  constructor(message) { super(message); this.name = 'ProviderPolicyError'; }
}
export class ReviewGenerationError extends Error {
  constructor(code) { super(`Simulation review generation failed: ${code}.`); this.name = 'ReviewGenerationError'; this.code = code; }
}

export function assertProvider(provider) {
  if (provider?.kind === 'external') throw new ProviderPolicyError('External model providers are disabled in this simulation build.');
  if (provider?.kind !== 'mock' || !isNonEmptyString(provider.id) || !isNonEmptyString(provider.model)
    || typeof provider.generateReview !== 'function') throw new ProviderPolicyError('A valid mock simulation provider is required.');
}

const defaultSchedule = (fn, ms) => {
  const timer = setTimeout(fn, ms);
  return () => clearTimeout(timer);
};

export function createReviewGenerator({ provider, now, timeoutMs = 5000, schedule = defaultSchedule }) {
  assertProvider(provider);
  if (typeof now !== 'function' || typeof schedule !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new TypeError('A clock, scheduler and non-negative timeout are required.');
  }
  // Snapshot the approved provider identity and method before asynchronous work.
  const { id: providerId, model } = provider;
  const generateReview = provider.generateReview.bind(provider);
  return Object.freeze({
    async generate({ session, correlationId, prompt, sourceEventIds, signal } = {}) {
      if (!session || typeof session.append !== 'function' || typeof session.transition !== 'function') {
        throw new TypeError('A simulation session is required.');
      }
      const actor = { kind: 'system', ref: 'review-generator' };
      const controller = new AbortController();
      let cancel = () => {};
      let onAbort;
      let stopCode;
      try {
        const snapshot = frozenCopy(prompt);
        const sources = frozenCopy(sourceEventIds);
        session.append({ eventType: 'AI_REVIEW_REQUESTED', actor,
          payload: { providerId, model, promptMeta: snapshot.meta }, correlationId });
        const interrupted = new Promise((resolve, reject) => {
          const stop = (code) => {
            if (stopCode) return;
            stopCode = code;
            // Settle the race before notifying the provider's abort listener.
            reject(new ReviewGenerationError(code));
            controller.abort();
          };
          onAbort = () => stop('PROVIDER_CANCELLED');
          signal?.addEventListener('abort', onAbort, { once: true });
          if (signal?.aborted) onAbort();
          else cancel = schedule(() => stop('PROVIDER_TIMEOUT'), timeoutMs);
        });
        const result = await Promise.race([interrupted, Promise.resolve().then(() => {
          if (stopCode) throw new ReviewGenerationError(stopCode);
          return generateReview({ system: snapshot.system, context: snapshot.context }, { signal: controller.signal });
        })]);
        if (stopCode) throw new ReviewGenerationError(stopCode);
        const review = parseAndValidateReview(result?.rawText, { allowedEvidenceRefs: snapshot.meta.allowedEvidenceRefs });
        const generated = createGeneratedReview({ model, providerId, sourceEventIds: sources, review }, { now });
        const event = session.append({ eventType: 'AI_REVIEW_GENERATED', actor: { kind: 'ai-model', ref: model }, payload: generated, correlationId });
        session.append({ eventType: 'HUMAN_REVIEW_REQUIRED', actor,
          payload: { generatedEventId: event.eventId, reason: 'AI interpretation requires human review.' }, correlationId });
        session.transition('awaiting-human-review');
        return generated;
      } catch (error) {
        const code = stopCode ?? (error instanceof ReviewResponseError ? error.code : 'PROVIDER_FAILED');
        session.append({ eventType: 'ERROR', actor, payload: { providerId, model, code }, correlationId });
        throw new ReviewGenerationError(code);
      } finally {
        cancel();
        if (onAbort) signal?.removeEventListener('abort', onAbort);
      }
    }
  });
}
