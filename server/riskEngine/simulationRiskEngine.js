import {
  SIGNAL_FEATURE_SET_VERSION,
  buildSimulationSignalFeatures
} from './simulationFeatureBuilder.js';

export const SIMULATION_RISK_MODEL_VERSION = 'simulation-risk-v0';

export function createSimulationRiskSuggestion({
  patientId,
  signals = [],
  createdAt = new Date().toISOString()
} = {}) {
  const features = buildSimulationSignalFeatures({ patientId, signals });
  const riskScore = scoreMissedActionRisk(features);

  if (riskScore < 0.45) {
    return null;
  }

  const riskTier = riskScore >= 0.75 ? 'urgent' : riskScore >= 0.55 ? 'watch' : 'info';

  return {
    suggestionId: suggestionIdFor(patientId, features),
    syntheticPatientRef: patientId,
    riskType: 'missed_action',
    riskTier,
    riskScore,
    status: 'suggested',
    title: 'Electrolyte result review may be needed',
    suggestedFlag: 'Electrolyte result review may be needed',
    suggestedBlocker: 'Unresolved abnormal blood result',
    suggestedTask: 'Review blood trend and document action',
    evidence: features.evidence,
    missingData: features.missingData,
    modelVersion: SIMULATION_RISK_MODEL_VERSION,
    featureSetVersion: SIGNAL_FEATURE_SET_VERSION,
    requiresHumanReview: true,
    createdAt,
    simulationOnly: true
  };
}

export function scoreMissedActionRisk(features) {
  let score = 0.1;

  if (features.lowPotassium) score += 0.22;
  if (features.missingMagnesium) score += 0.18;
  if ((features.latestNews2 ?? 0) >= 7) score += 0.24;
  if (features.workflowPlanGap) score += 0.12;
  if (features.preliminaryMicrobiology) score += 0.12;

  return Math.min(Number(score.toFixed(2)), 0.95);
}

function suggestionIdFor(patientId, features) {
  if (patientId === 'DCU-031' && (features.lowPotassium || features.missingMagnesium)) {
    return 'suggestion-dcu-031-electrolyte-review';
  }

  return `suggestion-${String(patientId ?? 'unknown').toLowerCase()}-missed-action`;
}
