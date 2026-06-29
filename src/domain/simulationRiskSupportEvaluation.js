import { buildSimulationRiskSupportContract } from './simulationRiskSupport.js';

const EVALUATION_VERSION = 'simulation-risk-support-evaluation-v1';
const GENERATED_BY = 'deterministic rules';
const CLINICAL_USE = 'not for live clinical deployment';
const HUMAN_REVIEW_REQUIRED = true;
const SIMULATION_ONLY = true;

const UNSAFE_LANGUAGE_PATTERNS = [
  /\bdiagnosis\b/i,
  /\bprescribe\b/i,
  /\btreatment recommendation\b/i,
  /\bAI decision\b/i,
  /\bclinical decision engine\b/i,
  /\bautonomous care\b/i,
  /\blive NHS deployment\b/i,
  /\bpatient needs potassium\b/i,
  /\bgive potassium\b/i,
  /\bpotassium recommendation\b/i
];

const READY_STATUS_BY_SIGNAL_TYPE = {
  documentation_quality: new Set(['ready']),
  handover_completeness: new Set(['ready']),
  escalation_readiness: new Set(['escalation readiness']),
  discharge_readiness: new Set(['ready'])
};

/**
 * Evaluate a compact suite of fictional risk-support scenarios against the
 * deterministic simulation-only contract.
 *
 * @param {Object} [options]
 * @param {Array<Object>} [options.scenarios]
 * @param {Function} [options.buildContract]
 * @returns {Object}
 */
export function evaluateSimulationRiskSupportScenarios({
  scenarios = [],
  buildContract = buildSimulationRiskSupportContract
} = {}) {
  const scenarioResults = scenarios.map((scenario) =>
    evaluateSimulationRiskSupportScenario({ scenario, buildContract })
  );

  const baseReport = {
    evaluationVersion: EVALUATION_VERSION,
    simulationOnly: SIMULATION_ONLY,
    humanReviewRequired: HUMAN_REVIEW_REQUIRED,
    generatedBy: GENERATED_BY,
    clinicalUse: CLINICAL_USE,
    totalScenarios: scenarioResults.length,
    passedScenarios: scenarioResults.filter((result) => result.pass).length,
    failedScenarios: scenarioResults.filter((result) => !result.pass).length,
    scenarioResults
  };

  const safetyLanguageCheck = scanSimulationRiskSupportLanguage(baseReport);

  return {
    ...baseReport,
    safetyLanguageCheck: {
      passed: safetyLanguageCheck.passed,
      matches: safetyLanguageCheck.matches
    }
  };
}

/**
 * Recursively scan generated evaluation output for unsafe or misleading wording.
 *
 * @param {unknown} value
 * @returns {{ passed: boolean, matches: string[], checkedTerms: string[] }}
 */
export function scanSimulationRiskSupportLanguage(value) {
  const serialized = JSON.stringify(value ?? {});
  const matches = UNSAFE_LANGUAGE_PATTERNS
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => pattern.source.replaceAll('\\b', '').replaceAll('\\', ''))
    .map((term) => term.replaceAll('?', '').replaceAll('+', ''));

  return {
    passed: matches.length === 0,
    matches,
    checkedTerms: UNSAFE_LANGUAGE_PATTERNS.map((pattern) =>
      pattern.source.replaceAll('\\b', '').replaceAll('\\', '')
    )
  };
}

function evaluateSimulationRiskSupportScenario({ scenario, buildContract }) {
  const contract = buildContract({
    patient: scenario.patient,
    journey: scenario.journey
  });
  const actualFlaggedSignals = contract.signals
    .filter(isFlaggedSignal)
    .map((signal) => ({
      signalType: signal.signalType,
      label: signal.label,
      category: signal.category,
      score: signal.score,
      reasons: [...(signal.reasons ?? [])],
      ...(signal.missingFields?.length > 0 ? { missingFields: [...signal.missingFields] } : {}),
      ...(signal.blockers?.length > 0 ? { blockers: [...signal.blockers] } : {})
    }));
  const actualFlaggedDomains = actualFlaggedSignals.map((signal) => signal.signalType);
  const expectedFlaggedDomains = [...(scenario.expectedFlaggedDomains ?? [])];
  const actualOverallCategory = contract.summary?.category ?? 'unknown';
  const expectedOverallCategory = scenario.expectedOverallCategory ?? null;
  const explainableReasons = actualFlaggedSignals.length > 0
    ? uniqueStrings([
      ...(contract.summary?.reasons ?? []),
      ...actualFlaggedSignals.flatMap((signal) => signal.reasons ?? [])
    ])
    : ['All simulated support signals are ready.'];
  const pass = arraysEqual(expectedFlaggedDomains, actualFlaggedDomains) &&
    (expectedOverallCategory == null || expectedOverallCategory === actualOverallCategory);

  return {
    scenarioId: scenario.scenarioId,
    scenarioName: scenario.scenarioName,
    rationale: scenario.rationale,
    expectedOverallCategory,
    expectedFlaggedDomains,
    actualOverallCategory,
    actualFlaggedDomains,
    actualFlaggedSignals,
    explainableReasons,
    missingDocumentationFields: [...(contract.missingDocumentationFields ?? [])],
    dischargeReadinessBlockers: [...(contract.dischargeReadiness?.blockers ?? [])],
    safetyMetadata: contract.metadata,
    reviewNotes: [...(contract.reviewNotes ?? [])],
    contractId: contract.contractId,
    patientId: contract.patientId,
    journeyId: contract.journeyId,
    contractSummary: contract.summary,
    pass
  };
}

function isFlaggedSignal(signal) {
  const readyStatuses = READY_STATUS_BY_SIGNAL_TYPE[signal.signalType] ?? new Set(['ready']);
  return !readyStatuses.has(signal.status);
}

function arraysEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter((value) => {
    const text = String(value ?? '').trim();
    if (!text || seen.has(text)) return false;
    seen.add(text);
    return true;
  });
}
