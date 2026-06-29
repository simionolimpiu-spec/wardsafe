const UNSAFE_LANGUAGE_PATTERNS = [
  /\bprescrib\w*\b/i,
  /\badminister potassium\b/i,
  /\bgive potassium\b/i,
  /\breplace potassium\b/i,
  /\bpotassium replacement\b/i,
  /\bpatient needs potassium\b/i,
  /\bdiagnos\w*\b/i,
  /\btreatment recommendation\b/i,
  /\bautonomous(?: clinical)? decision\b/i,
  /\bclinical decision engine\b/i,
  /\blive NHS use\b/i,
  /\bAI decision\b/i,
  /\bAI decided\b/i,
  /\bautomatically treat\b/i
];

export function guardSimulationSignalOutputs(signals) {
  if (!Array.isArray(signals)) {
    return [];
  }

  return signals.map((signal) => guardSimulationSignalOutput(signal));
}

export function guardSimulationSignalOutput(signal = {}) {
  const tracker = { flaggedUnsafeText: false };

  const guarded = {
    id: sanitiseIdentifier(signal.id, 'simulation-signal-unknown'),
    category: sanitiseEnum(signal.category, 'fallback'),
    priority: sanitiseEnum(signal.priority, 'review'),
    title: sanitiseText(signal.title, 'Review suggested: simulation-only cue', tracker),
    explanation: sanitiseText(
      signal.explanation,
      'Simulation-only cue. Evidence to check remains visible in the fictional record.',
      tracker
    ),
    evidence: sanitiseEvidence(signal.evidence, tracker),
    suggestedHumanReviewAction: sanitiseHumanReviewAction(signal.suggestedHumanReviewAction, tracker),
    simulationOnly: true,
    humanReviewRequired: true,
    unsafeClinicalAdvice: false,
    freshness: sanitiseFreshness(signal.freshness, tracker),
    missingDataNotes: sanitiseNotes(signal.missingDataNotes, tracker),
    outputGuard: {
      flaggedUnsafeText: tracker.flaggedUnsafeText
    }
  };

  return guarded;
}

function sanitiseEvidence(evidence, tracker) {
  if (!Array.isArray(evidence)) {
    return [];
  }

  return evidence.map((item, index) => ({
    id: sanitiseIdentifier(item?.id, `simulation-evidence-${index + 1}`),
    label: sanitiseText(item?.label, 'Simulation evidence to check.', tracker)
  }));
}

function sanitiseFreshness(freshness, tracker) {
  if (!freshness || typeof freshness !== 'object' || Array.isArray(freshness)) {
    return null;
  }

  return {
    state: sanitiseEnum(freshness.state, 'current'),
    label: sanitiseText(freshness.label, 'Latest simulated signal feed', tracker)
  };
}

function sanitiseNotes(notes, tracker) {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes.map((note) => sanitiseText(note, 'Simulation data gap noted.', tracker));
}

function sanitiseHumanReviewAction(value, tracker) {
  const action = sanitiseText(
    value,
    'Human review required: confirm the fictional evidence and document the outcome.',
    tracker
  );

  if (/^human review required:/i.test(action)) {
    return action;
  }

  return `Human review required: ${action}`;
}

function sanitiseText(value, fallback, tracker) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  const text = value.trim();
  if (UNSAFE_LANGUAGE_PATTERNS.some((pattern) => pattern.test(text))) {
    tracker.flaggedUnsafeText = true;
    return fallback;
  }

  return text;
}

function sanitiseIdentifier(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function sanitiseEnum(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return value.trim();
}
