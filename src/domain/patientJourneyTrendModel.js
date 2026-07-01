import modelData from '../data/patientJourneyTrendModel.json';

const DEFAULT_MODEL_VERSION = 'simulation-risk-ml-v0';
const DEFAULT_FEATURE_SET_VERSION = 'signal-features-ml-v0';
const RISK_TIER_THRESHOLDS = {
  watchUpper: 0.4,
  reviewUpper: 0.7
};

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
  }
};

export function scoreSimulatedTrend(features = {}) {
  const missingData = [];
  const featureOrder = Array.isArray(modelData.featureOrder) && modelData.featureOrder.length > 0
    ? modelData.featureOrder
    : [
        'news2Normalized',
        'potassiumFallingFlag',
        'documentationQualityNorm',
        'handoverCompleteNorm',
        'openTaskLoadNorm',
        'escalationStateNorm',
        'dischargeBlockerNorm'
      ];
  const weights = Array.isArray(modelData.weights) ? modelData.weights : [];
  const intercept = Number.isFinite(Number(modelData.intercept)) ? Number(modelData.intercept) : 0;
  const normalisedFeatures = normaliseFeatures(features, missingData);
  const linearScore = featureOrder.reduce((total, featureName, index) => {
    const weight = Number(weights[index] ?? 0);
    const value = Number(normalisedFeatures[featureName] ?? 0);
    return total + (weight * value);
  }, intercept);
  const riskScore = sigmoid(linearScore);
  const riskTier = toRiskTier(riskScore, modelData.riskTierThresholds ?? RISK_TIER_THRESHOLDS);
  const evidence = buildEvidence(featureOrder, weights, normalisedFeatures).slice(0, 4);
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

function buildEvidence(featureOrder, weights, features) {
  return featureOrder
    .map((featureName, index) => {
      const weight = Number(weights[index] ?? 0);
      const value = Number(features[featureName] ?? 0);
      const label = describeFeature(featureName, value, weight);
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

function describeFeature(featureName, value, weight) {
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

  return `${featureName} contributed to the simulated trend score.`;
}

function normaliseFeatures(features, missingData) {
  return {
    news2Normalized: normaliseBoundedNumber(features.news2Normalized, 'news2Normalized', missingData),
    potassiumFallingFlag: normaliseBinaryFlag(features.potassiumFallingFlag, 'potassiumFallingFlag', missingData),
    documentationQualityNorm: normaliseBoundedNumber(features.documentationQualityNorm, 'documentationQualityNorm', missingData),
    handoverCompleteNorm: normaliseBoundedNumber(features.handoverCompleteNorm, 'handoverCompleteNorm', missingData),
    openTaskLoadNorm: normaliseBoundedNumber(features.openTaskLoadNorm, 'openTaskLoadNorm', missingData),
    escalationStateNorm: normaliseBoundedNumber(features.escalationStateNorm, 'escalationStateNorm', missingData),
    dischargeBlockerNorm: normaliseBoundedNumber(features.dischargeBlockerNorm, 'dischargeBlockerNorm', missingData)
  };
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

function slugify(value) {
  return String(value ?? 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}
