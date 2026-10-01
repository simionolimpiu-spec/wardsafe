export const TRUST_TIERS = Object.freeze({
  SOURCE_FACT: 'source-fact',
  DETERMINISTIC_DERIVATION: 'deterministic-derivation',
  AI_INTERPRETATION: 'ai-interpretation',
  HUMAN_DECISION: 'human-decision'
});

export function isTrustTier(value) {
  return Object.values(TRUST_TIERS).includes(value);
}

export const INSTRUCTION_ELIGIBLE_ORIGINS = Object.freeze(['system-authored']);

export const KNOWLEDGE_TIER = 'reference-knowledge';
