import { CUE_TYPES } from '../../domain/evidenceCorpus.js';
import { frozenCopy } from '../domainValues.js';
import { validateAgainstSchema } from '../toolSchema.js';
import { UNSAFE_MODEL_WORDING_PATTERN } from './unsafeModelWording.js';
export { UNSAFE_MODEL_WORDING_PATTERN } from './unsafeModelWording.js';

const text = { type: 'string', minLength: 1 };
const strings = { type: 'array', items: { type: 'string' } };
const properties = {
  cueCategory: { type: 'string', enum: CUE_TYPES.filter(({ builtInApp }) => builtInApp).map(({ id }) => id) },
  title: text, interpretation: text, possibleRelevance: strings, evidenceRefs: strings,
  uncertainty: text, suggestedReviewPrompt: text
};
export const REVIEW_RESPONSE_SCHEMA = frozenCopy({ type: 'object', properties,
  required: Object.keys(properties), additionalProperties: false });

export class ReviewResponseError extends Error {
  constructor(code) { super(`Simulation review response rejected: ${code}.`); this.name = 'ReviewResponseError'; this.code = code; }
}

export function parseAndValidateReview(raw, { allowedEvidenceRefs } = {}) {
  let review;
  try {
    if (typeof raw !== 'string') throw new Error();
    review = JSON.parse(raw);
    if (!validateAgainstSchema(REVIEW_RESPONSE_SCHEMA, review).valid) throw new Error();
  } catch {
    throw new ReviewResponseError('MALFORMED_MODEL_RESPONSE');
  }
  for (const [key, value] of Object.entries(review)) {
    if ((Array.isArray(value) && value.length > 6)
      || (Array.isArray(value) ? value : [value]).some((item) => item.length > (key === 'title' ? 120 : 600))) {
      throw new ReviewResponseError('TEXT_TOO_LONG');
    }
  }
  if (!Array.isArray(allowedEvidenceRefs) || !review.evidenceRefs.length
    || review.evidenceRefs.some((ref) => !allowedEvidenceRefs.includes(ref))) {
    throw new ReviewResponseError('UNKNOWN_EVIDENCE_REF');
  }
  if (Object.values(review).flat().some((value) => UNSAFE_MODEL_WORDING_PATTERN.test(value))) {
    throw new ReviewResponseError('UNSAFE_MODEL_WORDING');
  }
  return frozenCopy(review);
}
