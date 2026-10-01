const DOCUMENTATION_CATEGORIES = new Set(['documentation', 'electrolyte-review']);
const HANDOVER_CATEGORIES = new Set(['handover']);
const ESCALATION_CATEGORIES = new Set(['escalation']);
const DETERIORATION_CATEGORIES = new Set(['deteriorating-obs', 'sepsis-screen']);
const DISCHARGE_CATEGORIES = new Set(['discharge']);
const WORKFLOW_CATEGORIES = new Set([
  ...DOCUMENTATION_CATEGORIES,
  ...HANDOVER_CATEGORIES,
  ...ESCALATION_CATEGORIES,
  ...DETERIORATION_CATEGORIES,
  ...DISCHARGE_CATEGORIES
]);

const SEVERITY_ORDER = {
  blocker: 0,
  review: 1,
  watch: 2
};

const RULE_ORDER = {
  'multiple-simultaneous-gaps': 0,
  'discharge-readiness-blocker': 1,
  'escalation-readiness-cue': 2,
  'documentation-gap': 3,
  'handover-completeness-issue': 4
};

export function buildHeuristicCues({ signals = [], flag = null } = {}) {
  const normalisedSignals = normaliseSignals(signals);
  const normalisedFlag = normaliseFlag(flag);

  return [
    evaluateMultipleSimultaneousGapsCue({ signals: normalisedSignals, flag: normalisedFlag }),
    evaluateDischargeReadinessBlockerCue({ signals: normalisedSignals, flag: normalisedFlag }),
    evaluateEscalationReadinessCue({ signals: normalisedSignals, flag: normalisedFlag }),
    evaluateDocumentationGapCue({ signals: normalisedSignals, flag: normalisedFlag }),
    evaluateHandoverCompletenessCue({ signals: normalisedSignals, flag: normalisedFlag })
  ]
    .filter(Boolean)
    .sort(compareHeuristicCues);
}

export function evaluateDocumentationGapCue({ signals = [], flag = null } = {}) {
  const documentationSignals = signalsInCategories(signals, DOCUMENTATION_CATEGORIES);
  const unresolvedFlag = isUnresolvedFlag(flag);

  if (documentationSignals.length === 0) {
    return null;
  }

  const relatedCount = documentationSignals.length + (unresolvedFlag ? 1 : 0);
  if (relatedCount < 2) {
    return null;
  }

  return createCue({
    ruleId: 'documentation-gap',
    cue: 'Documentation gap',
    severity: 'review',
    rationale: unresolvedFlag
      ? 'A documentation cue appears alongside an unresolved safety flag, so the current plan still needs human review.'
      : 'Two documentation-related cues are visible, so the current plan needs a clearer written summary.',
    contributingSignals: [
      ...signalIds(documentationSignals),
      ...(unresolvedFlag ? [flagContributor(flag)] : [])
    ],
    threshold: unresolvedFlag
      ? '1 documentation cue plus an unresolved safety flag'
      : 'At least 2 documentation-related cues'
  });
}

export function evaluateHandoverCompletenessCue({ signals = [], flag = null } = {}) {
  const handoverSignals = signalsInCategories(signals, HANDOVER_CATEGORIES);
  const escalationSignals = signalsInCategories(signals, ESCALATION_CATEGORIES);

  if (handoverSignals.length === 0 || escalationSignals.length === 0) {
    return null;
  }

  return createCue({
    ruleId: 'handover-completeness-issue',
    cue: 'Handover completeness issue',
    severity: 'review',
    rationale: 'Handover and escalation cues are both visible, so responsibility and next-step ownership still need checking.',
    contributingSignals: [
      ...signalIds(handoverSignals),
      ...signalIds(escalationSignals),
      ...(isUnresolvedFlag(flag) ? [flagContributor(flag)] : [])
    ],
    threshold: '1 handover cue plus 1 escalation cue'
  });
}

export function evaluateEscalationReadinessCue({ signals = [], flag = null } = {}) {
  const escalationSignals = signalsInCategories(signals, ESCALATION_CATEGORIES);
  const trendSignals = signalsInCategories(signals, DETERIORATION_CATEGORIES);

  if (escalationSignals.length === 0 || trendSignals.length === 0) {
    return null;
  }

  return createCue({
    ruleId: 'escalation-readiness-cue',
    cue: 'Escalation readiness cue',
    severity: 'blocker',
    rationale: 'An escalation cue is paired with a deteriorating observations or sepsis-screen cue, so the escalation path needs explicit human confirmation.',
    contributingSignals: [
      ...signalIds(escalationSignals),
      ...signalIds(trendSignals),
      ...(isUnresolvedFlag(flag) ? [flagContributor(flag)] : [])
    ],
    threshold: '1 escalation cue plus 1 deterioration or sepsis-screen cue'
  });
}

export function evaluateDischargeReadinessBlockerCue({ signals = [], flag = null } = {}) {
  const dischargeSignals = signalsInCategories(signals, DISCHARGE_CATEGORIES);
  const handoverSignals = signalsInCategories(signals, HANDOVER_CATEGORIES);
  const escalationSignals = signalsInCategories(signals, ESCALATION_CATEGORIES);

  if (dischargeSignals.length === 0 || (handoverSignals.length === 0 && escalationSignals.length === 0)) {
    return null;
  }

  return createCue({
    ruleId: 'discharge-readiness-blocker',
    cue: 'Discharge-readiness blocker',
    severity: 'blocker',
    rationale: 'A discharge cue is still open while handover or escalation cues remain visible, so discharge readiness is not settled.',
    contributingSignals: [
      ...signalIds(dischargeSignals),
      ...signalIds(handoverSignals),
      ...signalIds(escalationSignals),
      ...(isUnresolvedFlag(flag) ? [flagContributor(flag)] : [])
    ],
    threshold: '1 discharge cue plus 1 handover or escalation cue'
  });
}

export function evaluateMultipleSimultaneousGapsCue({ signals = [], flag = null } = {}) {
  const workflowSignals = signals.filter((signal) => WORKFLOW_CATEGORIES.has(String(signal.category ?? '')));
  const distinctCategories = new Set(workflowSignals.map((signal) => String(signal.category ?? '').trim()).filter(Boolean));

  if (distinctCategories.size < 3) {
    return null;
  }

  return createCue({
    ruleId: 'multiple-simultaneous-gaps',
    cue: 'Multiple simultaneous gaps',
    severity: 'blocker',
    rationale: 'Three or more workflow cues are open at once, so the safest read is a broader human review rather than a single narrow check.',
    contributingSignals: [
      ...signalIds(workflowSignals),
      ...(isUnresolvedFlag(flag) ? [flagContributor(flag)] : [])
    ],
    threshold: 'At least 3 distinct workflow cues'
  });
}

function createCue({
  ruleId,
  cue,
  severity,
  rationale,
  contributingSignals,
  threshold
}) {
  return {
    ruleId,
    cue,
    severity,
    rationale,
    contributingSignals: uniqueStrings(contributingSignals),
    threshold
  };
}

function compareHeuristicCues(left, right) {
  const severityDelta = severityRank(left.severity) - severityRank(right.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }

  return ruleRank(left.ruleId) - ruleRank(right.ruleId);
}

function severityRank(severity) {
  return SEVERITY_ORDER[severity] ?? SEVERITY_ORDER.review;
}

function ruleRank(ruleId) {
  return RULE_ORDER[ruleId] ?? Number.MAX_SAFE_INTEGER;
}

function signalsInCategories(signals, categories) {
  const wanted = new Set(categories);
  return signals.filter((signal) => wanted.has(String(signal.category ?? '')));
}

function signalIds(signals) {
  return signals
    .map((signal) => safeText(signal.id))
    .filter(Boolean);
}

function flagContributor(flag) {
  return `flag:${safeText(flag?.level, 'unknown')}`;
}

function normaliseSignals(signals) {
  if (!Array.isArray(signals)) {
    return [];
  }

  return signals.filter(isPlainObject).map((signal) => ({ ...signal }));
}

function normaliseFlag(flag) {
  if (!isPlainObject(flag)) {
    return null;
  }

  const level = safeText(flag.level, 'none');
  const title = safeText(flag.title);

  return {
    ...flag,
    level,
    title
  };
}

function isUnresolvedFlag(flag) {
  return Boolean(flag && flag.level !== 'none');
}

function uniqueStrings(values) {
  const seen = new Set();
  const unique = [];

  for (const value of Array.isArray(values) ? values : []) {
    const text = safeText(value);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    unique.push(text);
  }

  return unique;
}

function safeText(value, fallback = null) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
