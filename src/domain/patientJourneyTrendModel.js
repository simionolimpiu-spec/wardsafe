import modelData from '../data/patientJourneyTrendModel.json';

const DEFAULT_MODEL_VERSION = 'simulation-risk-ml-v0-2-sim';
const DEFAULT_FEATURE_SET_VERSION = 'signal-features-ml-v0-2-sim';
const DEFAULT_FEATURE_ORDER = [
  'news2Normalized',
  'potassiumFallingFlag',
  'documentationQualityNorm',
  'handoverCompleteNorm',
  'openTaskLoadNorm',
  'escalationStateNorm',
  'dischargeBlockerNorm',
  'news2TrendDeltaNorm',
  'safetyFlagLevelNorm',
  'simulationFlagCountNorm',
  'heuristicCueCountNorm',
  'blockerCueCountNorm',
  'documentationCuePresentFlag',
  'handoverCuePresentFlag',
  'escalationCuePresentFlag',
  'dischargeCuePresentFlag',
  'deterioratingObsCuePresentFlag'
];
const RISK_TIER_THRESHOLDS = {
  watchUpper: 0.4,
  reviewUpper: 0.7
};
const SAFETY_FLAG_LEVEL_SCORES = {
  none: 0,
  low: 0.25,
  watch: 0.35,
  medium: 0.6,
  review: 0.6,
  high: 0.85,
  blocker: 1,
  urgent: 1
};
const REQUIRED_BASE_FEATURES = new Set([
  'news2Normalized',
  'potassiumFallingFlag',
  'documentationQualityNorm',
  'handoverCompleteNorm',
  'openTaskLoadNorm',
  'escalationStateNorm',
  'dischargeBlockerNorm'
]);
const BINARY_FEATURES = new Set([
  'potassiumFallingFlag',
  'documentationCuePresentFlag',
  'handoverCuePresentFlag',
  'escalationCuePresentFlag',
  'dischargeCuePresentFlag',
  'deterioratingObsCuePresentFlag'
]);

const FEATURE_LABELS = {
  news2Normalized: {
    low: 'NEWS2 is low and kept the simulated trend score steadier.',
    medium: 'NEWS2 is moderately raised in the simulated trend.',
    high: 'NEWS2 is elevated in the simulated trend.'
  },
  potassiumFallingFlag: {
    low: 'Potassium is not falling in the simulated trend.',
    high: 'Potassium is falling in the simulated trend.'
  },
  documentationQualityNorm: {
    low: 'Documentation quality is weak and increased the simulated trend score.',
    medium: 'Documentation quality is mixed and had a modest effect.',
    high: 'Documentation quality is strong and lowered the simulated trend score.'
  },
  handoverCompleteNorm: {
    low: 'Handover completeness is limited and increased the simulated trend score.',
    medium: 'Handover completeness is partial and had a modest effect.',
    high: 'Handover completeness is strong and lowered the simulated trend score.'
  },
  openTaskLoadNorm: {
    low: 'Open task load is low and kept the simulated trend score steadier.',
    medium: 'Open task load is moderate in the simulation.',
    high: 'Open task load is elevated in the simulation.'
  },
  escalationStateNorm: {
    low: 'Escalation state is low in the simulation.',
    medium: 'Escalation state is partially raised in the simulation.',
    high: 'Escalation state is active in the simulation.'
  },
  dischargeBlockerNorm: {
    low: 'No major discharge-readiness blocker is visible in the simulation.',
    medium: 'Some discharge-readiness pressure is visible in the simulation.',
    high: 'A discharge-readiness blocker is visible in the simulation.'
  },
  news2TrendDeltaNorm: {
    low: 'NEWS2 did not increase across the simulated observation snapshots.',
    high: 'NEWS2 increased across the simulated observation snapshots.'
  },
  safetyFlagLevelNorm: {
    low: 'No unresolved safety flag intensity is visible in the simulated trend.',
    medium: 'A moderate unresolved safety flag intensity is visible in the simulated trend.',
    high: 'A high unresolved safety flag intensity is visible in the simulated trend.'
  },
  simulationFlagCountNorm: {
    low: 'Few simulation flags are visible in the simulated trend.',
    high: 'Multiple simulation flags are visible in the simulated trend.'
  },
  heuristicCueCountNorm: {
    low: 'Few heuristic review cues are visible in the simulated trend.',
    high: 'Multiple heuristic review cues are visible in the simulated trend.'
  },
  blockerCueCountNorm: {
    low: 'Few blocker-severity cues are visible in the simulated trend.',
    high: 'Multiple blocker-severity cues are visible in the simulated trend.'
  },
  documentationCuePresentFlag: {
    low: 'No documentation gap cue is visible in the simulated trend.',
    high: 'A documentation gap cue is visible in the simulated trend.'
  },
  handoverCuePresentFlag: {
    low: 'No handover completeness cue is visible in the simulated trend.',
    high: 'A handover completeness cue is visible in the simulated trend.'
  },
  escalationCuePresentFlag: {
    low: 'No escalation readiness cue is visible in the simulated trend.',
    high: 'An escalation readiness cue is visible in the simulated trend.'
  },
  dischargeCuePresentFlag: {
    low: 'No discharge-readiness blocker cue is visible in the simulated trend.',
    high: 'A discharge-readiness blocker cue is visible in the simulated trend.'
  },
  deterioratingObsCuePresentFlag: {
    low: 'No deteriorating observations cue is visible in the simulated trend.',
    high: 'A deteriorating observations cue is visible in the simulated trend.'
  }
};

export function buildSimulatedTrendFeatureSnapshot({
  patient = null,
  safetyFlag = null,
  heuristicCues = [],
  reviewSignals = [],
  featureSnapshots = []
} = {}) {
  const safePatient = isPlainObject(patient) ? patient : {};
  const openTasks = Array.isArray(safePatient.tasks)
    ? safePatient.tasks.filter((task) => isPlainObject(task) && task.status !== 'Done')
    : [];
  const dischargeBlockers = Array.isArray(safePatient.dischargeBlockers) ? safePatient.dischargeBlockers : [];
  const safeHeuristicCues = normaliseObjectArray(heuristicCues);
  const safeReviewSignals = normaliseObjectArray(reviewSignals);
  const riskFlags = Array.isArray(safePatient.riskFlags) ? safePatient.riskFlags.filter((flag) => safeText(flag, '')) : [];
  const unresolvedSafetyFlag = scoreSafetyFlagLevel(safetyFlag) > 0;
  const blockerCueCount = countBlockerHeuristicCues(safeHeuristicCues) + countBlockerReviewSignals(safeReviewSignals);

  return {
    syntheticPatientRef: safeText(safePatient.id, 'unknown'),
    news2Normalized: roundTo(clamp01(toNumber(safePatient.news2, 0) / 10), 3),
    potassiumFallingFlag: hasPotassiumTrendDown(safePatient) ? 1 : 0,
    documentationQualityNorm: buildDocumentationQualityScore(safePatient),
    handoverCompleteNorm: roundTo(clamp01(toNumber(safePatient.handoverComplete, 0) / 100), 3),
    openTaskLoadNorm: roundTo(clamp01(openTasks.length / 5), 3),
    escalationStateNorm: buildEscalationStateScore(safePatient.escalation),
    dischargeBlockerNorm: roundTo(clamp01(dischargeBlockers.length / 4), 3),
    news2TrendDeltaNorm: roundTo(Math.max(
      deriveNews2TrendDeltaFromPatient(safePatient),
      deriveNews2TrendDeltaFromSnapshots(featureSnapshots)
    ), 3),
    safetyFlagLevelNorm: roundTo(scoreSafetyFlagLevel(safetyFlag), 3),
    simulationFlagCountNorm: roundTo(clamp01((riskFlags.length + (unresolvedSafetyFlag ? 1 : 0)) / 6), 3),
    heuristicCueCountNorm: roundTo(clamp01(safeHeuristicCues.length / 5), 3),
    blockerCueCountNorm: roundTo(clamp01(blockerCueCount / 5), 3),
    documentationCuePresentFlag: hasCueDomain({ cues: safeHeuristicCues, signals: safeReviewSignals, domain: 'documentation' }) ? 1 : 0,
    handoverCuePresentFlag: hasCueDomain({ cues: safeHeuristicCues, signals: safeReviewSignals, domain: 'handover' }) ? 1 : 0,
    escalationCuePresentFlag: hasCueDomain({ cues: safeHeuristicCues, signals: safeReviewSignals, domain: 'escalation' }) ? 1 : 0,
    dischargeCuePresentFlag: hasCueDomain({ cues: safeHeuristicCues, signals: safeReviewSignals, domain: 'discharge' }) ? 1 : 0,
    deterioratingObsCuePresentFlag: hasCueDomain({ cues: safeHeuristicCues, signals: safeReviewSignals, domain: 'deterioratingObs' }) ? 1 : 0
  };
}

export function scoreSimulatedTrend(featureInput = {}, context = {}) {
  const missingData = [];
  const featureOrder = Array.isArray(modelData.featureOrder) && modelData.featureOrder.length > 0
    ? modelData.featureOrder
    : DEFAULT_FEATURE_ORDER;
  const weights = Array.isArray(modelData.weights) ? modelData.weights : [];
  const intercept = Number.isFinite(Number(modelData.intercept)) ? Number(modelData.intercept) : 0;
  const features = normaliseFeatureInput(featureInput, context);
  const normalisedFeatures = normaliseFeatures(features, missingData, featureOrder);
  const linearScore = featureOrder.reduce((total, featureName, index) => {
    const weight = Number(weights[index] ?? 0);
    const value = Number(normalisedFeatures[featureName] ?? 0);
    return total + (weight * value);
  }, intercept);
  const riskScore = sigmoid(linearScore);
  const riskTier = toRiskTier(riskScore, modelData.riskTierThresholds ?? RISK_TIER_THRESHOLDS);
  const evidence = buildEvidence(featureOrder, weights, normalisedFeatures).slice(0, 8);
  const now = new Date().toISOString();
  const syntheticPatientRef = safeText(features.syntheticPatientRef, 'unknown');

  return {
    suggestionId: `simulated-trend-${slugify(syntheticPatientRef)}`,
    syntheticPatientRef,
    riskType: 'simulated_trend',
    riskTier,
    riskScore: roundTo(riskScore, 3),
    status: 'suggested',
    title: `Simulated trend signal: ${tierLabel(riskTier)}`,
    suggestedFlag: `Simulated trend signal suggests ${tierLabel(riskTier)}`,
    suggestedTask: 'Human review required: review the simulated trend inputs and document the current nursing response.',
    evidence,
    missingData,
    modelVersion: safeText(modelData.modelVersion, DEFAULT_MODEL_VERSION),
    featureSetVersion: safeText(modelData.featureSetVersion, DEFAULT_FEATURE_SET_VERSION),
    requiresHumanReview: true,
    simulationOnly: true,
    createdAt: now,
    updatedAt: now,
    actions: []
  };
}

function normaliseFeatureInput(featureInput, context) {
  const contextualFeatures = isPlainObject(context) && Object.keys(context).length > 0
    ? buildSimulatedTrendFeatureSnapshot(context)
    : {};

  if (Array.isArray(featureInput)) {
    return {
      ...contextualFeatures,
      ...buildFeatureSnapshotFromSnapshots(featureInput)
    };
  }

  if (isFeatureBuilderInput(featureInput)) {
    return {
      ...contextualFeatures,
      ...buildSimulatedTrendFeatureSnapshot(featureInput)
    };
  }

  if (isPlainObject(featureInput)) {
    return {
      ...contextualFeatures,
      ...featureInput
    };
  }

  return contextualFeatures;
}

function buildFeatureSnapshotFromSnapshots(featureSnapshots) {
  const snapshots = normaliseObjectArray(featureSnapshots);
  const latestSnapshot = snapshots.at(-1) ?? {};
  const news2TrendDeltaNorm = Math.max(
    normaliseOptionalBoundedNumber(latestSnapshot.news2TrendDeltaNorm),
    deriveNews2TrendDeltaFromSnapshots(snapshots)
  );

  return {
    ...latestSnapshot,
    news2TrendDeltaNorm: roundTo(news2TrendDeltaNorm, 3)
  };
}

function isFeatureBuilderInput(value) {
  return isPlainObject(value) && (
    hasOwn(value, 'patient') ||
    hasOwn(value, 'safetyFlag') ||
    hasOwn(value, 'heuristicCues') ||
    hasOwn(value, 'reviewSignals') ||
    hasOwn(value, 'featureSnapshots')
  );
}

function buildEvidence(featureOrder, weights, features) {
  return featureOrder
    .map((featureName, index) => {
      const weight = Number(weights[index] ?? 0);
      const value = Number(features[featureName] ?? 0);
      const label = describeFeature(featureName, value);
      const contribution = weight * value;

      return {
        featureName,
        contribution,
        label
      };
    })
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
    .map((item) => ({ label: item.label }));
}

function describeFeature(featureName, value) {
  if (featureName === 'potassiumFallingFlag') {
    return value >= 0.5
      ? FEATURE_LABELS.potassiumFallingFlag.high
      : FEATURE_LABELS.potassiumFallingFlag.low;
  }

  if (featureName === 'news2Normalized') {
    if (value >= 0.7) return FEATURE_LABELS.news2Normalized.high;
    if (value >= 0.4) return FEATURE_LABELS.news2Normalized.medium;
    return FEATURE_LABELS.news2Normalized.low;
  }

  if (featureName === 'documentationQualityNorm') {
    if (value >= 0.7) return FEATURE_LABELS.documentationQualityNorm.high;
    if (value >= 0.4) return FEATURE_LABELS.documentationQualityNorm.medium;
    return FEATURE_LABELS.documentationQualityNorm.low;
  }

  if (featureName === 'handoverCompleteNorm') {
    if (value >= 0.7) return FEATURE_LABELS.handoverCompleteNorm.high;
    if (value >= 0.4) return FEATURE_LABELS.handoverCompleteNorm.medium;
    return FEATURE_LABELS.handoverCompleteNorm.low;
  }

  if (featureName === 'openTaskLoadNorm') {
    if (value >= 0.7) return FEATURE_LABELS.openTaskLoadNorm.high;
    if (value >= 0.4) return FEATURE_LABELS.openTaskLoadNorm.medium;
    return FEATURE_LABELS.openTaskLoadNorm.low;
  }

  if (featureName === 'escalationStateNorm') {
    if (value >= 0.7) return FEATURE_LABELS.escalationStateNorm.high;
    if (value >= 0.4) return FEATURE_LABELS.escalationStateNorm.medium;
    return FEATURE_LABELS.escalationStateNorm.low;
  }

  if (featureName === 'dischargeBlockerNorm') {
    if (value >= 0.7) return FEATURE_LABELS.dischargeBlockerNorm.high;
    if (value >= 0.4) return FEATURE_LABELS.dischargeBlockerNorm.medium;
    return FEATURE_LABELS.dischargeBlockerNorm.low;
  }

  if (featureName === 'news2TrendDeltaNorm') {
    return value >= 0.05
      ? FEATURE_LABELS.news2TrendDeltaNorm.high
      : FEATURE_LABELS.news2TrendDeltaNorm.low;
  }

  if (featureName === 'safetyFlagLevelNorm') {
    if (value >= 0.75) return FEATURE_LABELS.safetyFlagLevelNorm.high;
    if (value >= 0.35) return FEATURE_LABELS.safetyFlagLevelNorm.medium;
    return FEATURE_LABELS.safetyFlagLevelNorm.low;
  }

  if (featureName === 'simulationFlagCountNorm') {
    return value >= 0.35
      ? FEATURE_LABELS.simulationFlagCountNorm.high
      : FEATURE_LABELS.simulationFlagCountNorm.low;
  }

  if (featureName === 'heuristicCueCountNorm') {
    return value >= 0.35
      ? FEATURE_LABELS.heuristicCueCountNorm.high
      : FEATURE_LABELS.heuristicCueCountNorm.low;
  }

  if (featureName === 'blockerCueCountNorm') {
    return value >= 0.25
      ? FEATURE_LABELS.blockerCueCountNorm.high
      : FEATURE_LABELS.blockerCueCountNorm.low;
  }

  if (BINARY_FEATURES.has(featureName) && FEATURE_LABELS[featureName]) {
    return value >= 0.5
      ? FEATURE_LABELS[featureName].high
      : FEATURE_LABELS[featureName].low;
  }

  return `${featureName} contributed to the simulated trend score.`;
}

function normaliseFeatures(features, missingData, featureOrder = DEFAULT_FEATURE_ORDER) {
  const normalised = {};

  for (const featureName of featureOrder) {
    if (BINARY_FEATURES.has(featureName)) {
      normalised[featureName] = REQUIRED_BASE_FEATURES.has(featureName)
        ? normaliseBinaryFlag(features[featureName], featureName, missingData)
        : normaliseOptionalBinaryFlag(features[featureName]);
    } else {
      normalised[featureName] = REQUIRED_BASE_FEATURES.has(featureName)
        ? normaliseBoundedNumber(features[featureName], featureName, missingData)
        : normaliseOptionalBoundedNumber(features[featureName]);
    }
  }

  return normalised;
}

function normaliseBoundedNumber(value, featureName, missingData) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    missingData.push(`${featureName} missing or invalid; defaulted to 0.`);
    return 0;
  }

  return clamp01(numericValue);
}

function normaliseBinaryFlag(value, featureName, missingData) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    missingData.push(`${featureName} missing or invalid; defaulted to 0.`);
    return 0;
  }

  return numericValue >= 0.5 ? 1 : 0;
}

function normaliseOptionalBoundedNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return clamp01(numericValue);
}

function normaliseOptionalBinaryFlag(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return numericValue >= 0.5 ? 1 : 0;
}

function toRiskTier(score, thresholds) {
  const watchUpper = Number.isFinite(Number(thresholds?.watchUpper)) ? Number(thresholds.watchUpper) : RISK_TIER_THRESHOLDS.watchUpper;
  const reviewUpper = Number.isFinite(Number(thresholds?.reviewUpper)) ? Number(thresholds.reviewUpper) : RISK_TIER_THRESHOLDS.reviewUpper;

  if (score < watchUpper) {
    return 'watch';
  }

  if (score <= reviewUpper) {
    return 'review';
  }

  return 'urgent';
}

function tierLabel(riskTier) {
  if (riskTier === 'urgent') {
    return 'urgent review cue';
  }

  if (riskTier === 'review') {
    return 'review cue';
  }

  return 'watch-level review cue';
}

function buildDocumentationQualityScore(patient) {
  const checks = [
    hasText(patient.plan),
    hasText(patient.sbar?.recommendation),
    Array.isArray(patient.currentState) && patient.currentState.length > 0,
    Array.isArray(patient.auditTrail) && patient.auditTrail.length > 0,
    Array.isArray(patient.responseHistory) && patient.responseHistory.length > 0
  ];

  return Number(
    checks.reduce((total, present) => total + (present ? 0.2 : 0), 0).toFixed(2)
  );
}

function buildEscalationStateScore(value) {
  if (value === 'Active') {
    return 1;
  }

  if (value === 'Monitoring') {
    return 0.55;
  }

  if (value === 'None') {
    return 0.1;
  }

  return 0;
}

function hasPotassiumTrendDown(patient) {
  const potassiumSeries = Array.isArray(patient.labs?.potassium) ? patient.labs.potassium : [];
  if (potassiumSeries.length > 1) {
    const firstValue = toNumber(potassiumSeries[0]?.value, NaN);
    const lastValue = toNumber(potassiumSeries.at(-1)?.value, NaN);
    if (Number.isFinite(firstValue) && Number.isFinite(lastValue)) {
      return lastValue < firstValue;
    }
  }

  const currentState = Array.isArray(patient.currentState) ? patient.currentState : [];
  return currentState.some((entry) => String(entry ?? '').toLowerCase().includes('potassium falling'));
}

function deriveNews2TrendDeltaFromPatient(patient) {
  const observationSnapshots = Array.isArray(patient.observations)
    ? patient.observations
    : Array.isArray(patient.news2History)
      ? patient.news2History
      : [];

  return deriveNews2TrendDeltaFromSnapshots(observationSnapshots);
}

function deriveNews2TrendDeltaFromSnapshots(featureSnapshots) {
  const news2Values = normaliseObjectArray(featureSnapshots)
    .map(readNormalisedNews2)
    .filter((value) => Number.isFinite(value));

  if (news2Values.length < 2) {
    return 0;
  }

  return clamp01(news2Values.at(-1) - news2Values[0]);
}

function readNormalisedNews2(snapshot) {
  if (!isPlainObject(snapshot)) {
    return NaN;
  }

  if (Number.isFinite(Number(snapshot.news2Normalized))) {
    return clamp01(Number(snapshot.news2Normalized));
  }

  if (Number.isFinite(Number(snapshot.news2))) {
    return clamp01(Number(snapshot.news2) / 10);
  }

  return NaN;
}

function scoreSafetyFlagLevel(flag) {
  if (!isPlainObject(flag)) {
    return 0;
  }

  const level = safeText(flag.level, 'none').toLowerCase();
  return SAFETY_FLAG_LEVEL_SCORES[level] ?? 0;
}

function countBlockerHeuristicCues(cues) {
  return cues.filter((cue) => safeText(cue.severity, '').toLowerCase() === 'blocker').length;
}

function countBlockerReviewSignals(signals) {
  return signals.filter((signal) => safeText(signal.priority, '').toLowerCase() === 'blocker').length;
}

function hasCueDomain({ cues, signals, domain }) {
  return cues.some((cue) => cueMatchesDomain(cue, domain)) ||
    signals.some((signal) => signalMatchesDomain(signal, domain));
}

function cueMatchesDomain(cue, domain) {
  const haystack = [
    cue.ruleId,
    cue.cue,
    cue.category,
    cue.title
  ].map((value) => safeText(value, '').toLowerCase()).join(' ');
  const patterns = {
    documentation: ['documentation'],
    handover: ['handover'],
    escalation: ['escalation'],
    discharge: ['discharge'],
    deterioratingObs: ['deteriorating', 'sepsis-screen', 'sepsis screen']
  };

  return (patterns[domain] ?? []).some((pattern) => haystack.includes(pattern));
}

function signalMatchesDomain(signal, domain) {
  const category = safeText(signal.category, '').toLowerCase();
  const title = safeText(signal.title, '').toLowerCase();
  const signalCode = safeText(signal.signalCode, '').toLowerCase();
  const haystack = `${category} ${title} ${signalCode}`;
  const categories = {
    documentation: ['documentation', 'electrolyte-review'],
    handover: ['handover'],
    escalation: ['escalation'],
    discharge: ['discharge'],
    deterioratingObs: ['deteriorating-obs', 'sepsis-screen']
  };

  return (categories[domain] ?? []).some((pattern) => haystack.includes(pattern));
}

function normaliseObjectArray(value) {
  return Array.isArray(value) ? value.filter(isPlainObject).map((item) => ({ ...item })) : [];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function roundTo(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function safeText(value, fallback = 'unknown') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function slugify(value) {
  return String(value ?? 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
