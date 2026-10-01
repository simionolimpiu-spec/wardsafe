import { LAB_UNITS } from '../clinicalFact.js';

function abortError() {
  const error = new Error('Simulation provider cancelled.');
  error.name = 'AbortError';
  return error;
}

function defaultResponse(context) {
  const section = (label) => {
    const line = context.split('\n').find((item) => item.startsWith(`${label}: `));
    return line ? JSON.parse(line.slice(label.length + 2)) : [];
  };
  const facts = section('SOURCE_FACTS_JSON');
  const trend = section('DETERMINISTIC_DERIVATIONS_JSON').find((item) =>
    item.direction === 'falling' && Object.hasOwn(LAB_UNITS, item.analyte)
    && Number.isFinite(item.first) && Number.isFinite(item.latest) && item.sourceFactIds?.length);
  const common = {
    possibleRelevance: [], uncertainty: 'The supplied simulated context may be incomplete; human review required.',
    suggestedReviewPrompt: 'Clinical review may be appropriate according to local policy.'
  };
  return JSON.stringify(trend ? {
    cueCategory: trend.analyte === 'potassium' || trend.analyte === 'magnesium' ? 'electrolyte-review' : 'documentation',
    title: `Review cue: ${trend.analyte} trend`,
    interpretation: `${trend.analyte[0].toUpperCase()}${trend.analyte.slice(1)} has decreased across the simulated period (${trend.first} to ${trend.latest} ${LAB_UNITS[trend.analyte]}).`,
    evidenceRefs: trend.sourceFactIds, ...common
  } : {
    cueCategory: 'documentation', title: 'Review cue: documentation completeness',
    interpretation: 'Review the supplied simulated record for documentation gaps.',
    evidenceRefs: facts.length ? [facts[0].factId] : [], ...common
  });
}

export function createMockAIModelProvider({ responses } = {}) {
  if (responses !== undefined && (!Array.isArray(responses)
    || responses.some((item) => typeof item !== 'string' && !(item instanceof Error) && item?.hang !== true))) {
    throw new TypeError('Invalid mock simulation responses.');
  }
  const fixtures = responses?.map((item) => item?.hang === true ? Object.freeze({ hang: true }) : item) ?? [];
  let index = 0;
  return Object.freeze({
    id: 'mock-simulation', model: 'mock-review-v1', kind: 'mock',
    generateReview({ context }, { signal } = {}) {
      if (signal?.aborted) return Promise.reject(abortError());
      const fixture = fixtures[index++];
      return new Promise((resolve, reject) => {
        const onAbort = () => { signal?.removeEventListener('abort', onAbort); reject(abortError()); };
        signal?.addEventListener('abort', onAbort, { once: true });
        if (fixture?.hang === true) return;
        try {
          if (fixture instanceof Error) throw fixture;
          resolve({ rawText: fixture ?? defaultResponse(context) });
        } catch (error) {
          reject(error);
        } finally {
          signal?.removeEventListener('abort', onAbort);
        }
      });
    }
  });
}
