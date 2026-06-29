export const SAFETY_LANGUAGE_RULES = [
  {
    id: 'diagnosis',
    checkedTerm: 'diagnosis',
    pattern: /\bdiagnos(?:is|e|es|ing|tic(?:\s+(?:system|functionality|claim|wording))?)\b/gi
  },
  {
    id: 'prescribing',
    checkedTerm: 'prescribe',
    pattern: /\bprescrib(?:e|es|ing|ed)|\bprescribing\s+tool\b|\bprescription\b/gi
  },
  {
    id: 'treatment-recommendation',
    checkedTerm: 'treatment recommendation',
    pattern: /\btreatment\s+recommendation\b|\brecommend\s+treatment\b|\btreatment\s+instruction\b|\btreat\s+with\b/gi
  },
  {
    id: 'ai-decision',
    checkedTerm: 'AI decision',
    pattern: /\bAI\s+decision\b/gi
  },
  {
    id: 'clinical-decision-engine',
    checkedTerm: 'clinical decision engine',
    pattern: /\bclinical\s+decision\s+engine\b/gi
  },
  {
    id: 'autonomous-care',
    checkedTerm: 'autonomous care',
    pattern: /\bautonomous\s+care\b|\bautonomous\s+(?:clinical\s+)?decision(?:s|-making| making)?\b/gi
  },
  {
    id: 'live-nhs-deployment',
    checkedTerm: 'live NHS deployment',
    pattern: /\blive\s+NHS\s+deployment\b/gi
  },
  {
    id: 'live-clinical-deployment',
    checkedTerm: 'live clinical deployment',
    pattern: /\blive\s+clinical\s+deployment\b/gi
  },
  {
    id: 'clinical-validation',
    checkedTerm: 'clinically validated',
    pattern: /\bclinically\s+validated\b|\bclinical\s+validation\b/gi
  },
  {
    id: 'potassium-recommendation',
    checkedTerm: 'potassium recommendation',
    pattern: /\bpotassium\s+recommendation\b/gi
  },
  {
    id: 'patient-needs-potassium',
    checkedTerm: 'patient needs potassium',
    pattern: /\bpatient\s+needs\s+potassium\b/gi
  },
  {
    id: 'give-potassium',
    checkedTerm: 'give potassium',
    pattern: /\bgive\s+potassium\b/gi
  }
];

export const SAFETY_BOUNDARY_REQUIRED_CONCEPTS = [
  {
    id: 'simulation-only',
    label: 'simulation-only',
    pattern: /\bsimulation[-\s]only\b|\bsimulation[-\s]first\b/i
  },
  {
    id: 'fictional-data',
    label: 'fictional data',
    pattern: /\bfictional\s+(?:patient|patients|data|scenario|scenarios|fixture|fixtures)\b/i
  },
  {
    id: 'no-real-patient-data',
    label: 'no real patient data',
    pattern: /\bno\s+(?:real|live)\s+patient\s+data\b/i
  },
  {
    id: 'not-live-clinical-deployment',
    label: 'not for live clinical deployment',
    pattern: /\bnot\s+(?:ready\s+)?for\s+live\s+clinical\s+deployment\b|\bno\s+clinical\s+deployment\b|\bno\s+live\s+deployment\s+claim\b/i
  },
  {
    id: 'no-diagnosis',
    label: 'no diagnosis',
    pattern: /\bno\s+diagnos(?:is|tic)\b|\bnot\s+a\s+diagnostic\s+system\b|\bdoes\s+not\s+diagnose\b/i
  },
  {
    id: 'no-prescribing',
    label: 'no prescribing',
    pattern: /\bno\s+prescribing\b|\bnot\s+a\s+prescribing\s+tool\b|\bdoes\s+not\s+prescribe\b/i
  },
  {
    id: 'no-treatment-recommendation',
    label: 'no treatment recommendation',
    pattern: /\bno\s+treatment\s+recommendation\b|\bdoes\s+not\s+recommend\s+treatment\b|\bno\s+diagnosis,\s+prescribing,\s+treatment\s+recommendation\b/i
  },
  {
    id: 'human-review-or-judgement',
    label: 'human review or clinical judgement',
    pattern: /\bhuman\s+review\b|\bclinical\s+judgement\s+remains\s+central\b|\breplace\s+clinical\s+judgement\b/i
  }
];

const STRICT_ALLOWED_BOUNDARY_PATTERNS = [
  /\bnot\s+(?:ready\s+)?for\s+live\s+clinical\s+deployment\b/i,
  /\bno\s+live\s+clinical\s+deployment\s+claim\b/i,
  /\bnot\s+clinically\s+validated\b/i,
  /\bnot\s+for\s+clinical\s+validation\b/i,
  /\bnot\s+clinical\s+validation\b/i
];

const DOCUMENTATION_BOUNDARY_CONTEXT_PATTERN =
  /\b(no|not|never|without|avoid|do not|does not|must not|should not|reject|rejected|prohibited|boundary|guardrail|checklist|claim|wording)\b|\bwhat it is not\b|\blanguage to avoid\b|\bnot be positioned\b/i;

export function scanStrictSafetyLanguage(value, { checkedLabel = 'generated output' } = {}) {
  return buildScanResult({
    checkedLabel,
    text: serialiseSafetyLanguageInput(value),
    contextRadius: 120,
    isAllowedMatch: ({ context }) => STRICT_ALLOWED_BOUNDARY_PATTERNS.some((pattern) => pattern.test(context))
  });
}

export function scanBoundaryAwareSafetyLanguage(
  value,
  {
    checkedLabel = 'documentation',
    requiredConcepts = []
  } = {}
) {
  const text = serialiseSafetyLanguageInput(value);
  const result = buildScanResult({
    checkedLabel,
    text,
    contextRadius: 260,
    isAllowedMatch: ({ context }) => DOCUMENTATION_BOUNDARY_CONTEXT_PATTERN.test(context)
  });
  const missingBoundaryConcepts = requiredConcepts
    .filter((concept) => !concept.pattern.test(text))
    .map((concept) => ({
      id: concept.id,
      label: concept.label
    }));

  return {
    ...result,
    missingBoundaryConcepts,
    passed: result.passed && missingBoundaryConcepts.length === 0
  };
}

export function serialiseSafetyLanguageInput(value) {
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value ?? {});
  } catch {
    return String(value ?? '');
  }
}

function buildScanResult({ checkedLabel, text, contextRadius, isAllowedMatch }) {
  const violations = [];

  for (const rule of SAFETY_LANGUAGE_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      const matchedText = match[0];
      const context = excerptAround(text, index, matchedText.length, contextRadius);

      if (isAllowedMatch({ rule, context, matchedText })) continue;

      violations.push({
        ruleId: rule.id,
        checkedTerm: rule.checkedTerm,
        match: matchedText,
        excerpt: compactWhitespace(context)
      });
    }
  }

  return {
    checkedLabel,
    passed: violations.length === 0,
    violations,
    checkedTerms: SAFETY_LANGUAGE_RULES.map((rule) => rule.checkedTerm)
  };
}

function excerptAround(text, index, length, radius) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);

  return text.slice(start, end);
}

function compactWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}
