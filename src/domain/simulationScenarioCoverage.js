import { evaluateSimulationRiskSupportScenarios } from './simulationRiskSupportEvaluation.js';
import { scanStrictSafetyLanguage } from './safetyLanguage.js';

const COVERAGE_VERSION = 'simulation-scenario-coverage-v1';
const SOURCE = 'fictional scenario fixtures';
const GENERATED_BY = 'deterministic rules';
const CLINICAL_USE = 'not for live clinical deployment';
const STRUCTURED_REVIEW_SUPPORT =
  'Structured review support for fictional scenario coverage in a simulation-only prototype.';
const FICTIONAL_SCENARIO_ONLY = 'fictional scenario only';

export const DEFAULT_SCENARIO_COVERAGE_DEFINITIONS = [
  {
    domainId: 'documentationQuality',
    label: 'documentation quality',
    suggestedScenarioType: 'Documentation quality follow-up gap',
    rationale: 'Adds another fictional fixture that exercises documentation-quality review paths.'
  },
  {
    domainId: 'handoverCompleteness',
    label: 'handover completeness',
    suggestedScenarioType: 'Handover completion follow-up gap',
    rationale: 'Adds another fictional fixture that exercises handover-completeness review paths.'
  },
  {
    domainId: 'escalationReadiness',
    label: 'escalation readiness',
    suggestedScenarioType: 'Escalation readiness follow-up cue',
    rationale: 'Adds another fictional fixture that exercises escalation-readiness review paths.'
  },
  {
    domainId: 'dischargeReadiness',
    label: 'discharge readiness',
    suggestedScenarioType: 'Discharge readiness follow-up blocker',
    rationale: 'Adds another fictional fixture that exercises discharge-readiness review paths.'
  },
  {
    domainId: 'multipleSimultaneousGaps',
    label: 'multiple simultaneous gaps',
    suggestedScenarioType: 'Mixed-gap workflow crossover',
    rationale: 'Adds a second fictional fixture where several rule paths are open at the same time.'
  },
  {
    domainId: 'partialInputHandling',
    label: 'partial input handling',
    suggestedScenarioType: 'Partial fictional input recovery case',
    rationale: 'Adds another fictional fixture that checks graceful handling of incomplete simulated input.'
  },
  {
    domainId: 'lowSignalBaseline',
    label: 'low-signal baseline',
    suggestedScenarioType: 'Low-signal baseline variant',
    rationale: 'Adds another fictional low-signal fixture to confirm steady ready-path behaviour.'
  },
  {
    domainId: 'missingObservationDocumentation',
    label: 'missing observation documentation',
    suggestedScenarioType: 'Observation documentation omission',
    rationale: 'Adds another fictional fixture with thin observation notes to widen documentation coverage.'
  },
  {
    domainId: 'missingHandoverField',
    label: 'missing handover field',
    suggestedScenarioType: 'Handover field omission',
    rationale: 'Adds another fictional fixture with a narrow handover omission to widen handover coverage.'
  },
  {
    domainId: 'unresolvedEscalationCue',
    label: 'unresolved escalation cue',
    suggestedScenarioType: 'Escalation cue follow-up variant',
    rationale: 'Adds another fictional fixture with a single unresolved escalation cue and otherwise steady inputs.'
  },
  {
    domainId: 'dischargeReadinessBlocker',
    label: 'discharge-readiness blocker',
    suggestedScenarioType: 'Discharge blocker follow-up variant',
    rationale: 'Adds another fictional fixture with a focused discharge-readiness blocker.'
  }
];

/**
 * Analyze fictional scenario coverage for the deterministic risk-support rules.
 *
 * @param {Object} [options]
 * @param {Array<Object>} [options.scenarios]
 * @param {Array<Object>} [options.coverageDefinitions]
 * @param {Function} [options.evaluateScenarioSet]
 * @param {Function} [options.scanSafetyLanguage]
 * @returns {Object}
 */
export function analyzeSimulationScenarioCoverage({
  scenarios = [],
  coverageDefinitions = DEFAULT_SCENARIO_COVERAGE_DEFINITIONS,
  evaluateScenarioSet = evaluateSimulationRiskSupportScenarios,
  scanSafetyLanguage = scanStrictSafetyLanguage
} = {}) {
  const evaluation = evaluateScenarioSet({ scenarios });
  const evaluationByScenarioId = new Map(
    (evaluation.scenarioResults ?? []).map((result) => [result.scenarioId, result])
  );
  const domainCoverage = coverageDefinitions.map((definition) =>
    buildDomainCoverage(definition, scenarios)
  );
  const coveredDomains = domainCoverage.filter((item) => item.coverageStatus === 'covered');
  const underCoveredDomains = domainCoverage.filter((item) => item.coverageStatus === 'under-covered');
  const uncoveredDomains = domainCoverage.filter((item) => item.coverageStatus === 'not-covered');
  const scenarioCoverage = scenarios.map((scenario) =>
    buildScenarioCoverageEntry(scenario, evaluationByScenarioId.get(scenario.scenarioId))
  );

  const baseReport = {
    coverageVersion: COVERAGE_VERSION,
    simulationOnly: true,
    source: SOURCE,
    generatedBy: GENERATED_BY,
    humanReviewRequired: true,
    clinicalUse: CLINICAL_USE,
    structuredReviewSupport: STRUCTURED_REVIEW_SUPPORT,
    totalScenarios: scenarios.length,
    coveredDomains,
    underCoveredDomains,
    uncoveredDomains,
    scenarioCoverage,
    recommendedFictionalScenarioAdditions: buildRecommendedAdditions([
      ...underCoveredDomains,
      ...uncoveredDomains
    ])
  };
  const safetyLanguageCheck = scanSafetyLanguage(baseReport, {
    checkedLabel: 'simulation scenario coverage report'
  });

  return {
    ...baseReport,
    safetyLanguageCheck: {
      passed: safetyLanguageCheck.passed,
      violationCount: safetyLanguageCheck.violations.length
    }
  };
}

function buildDomainCoverage(definition, scenarios) {
  const matchedScenarios = scenarios.filter((scenario) =>
    (scenario.coverageTags ?? []).includes(definition.domainId)
  );

  return {
    domainId: definition.domainId,
    label: definition.label,
    coverageStatus: classifyCoverageStatus(matchedScenarios.length),
    scenarioCount: matchedScenarios.length,
    scenarioIds: matchedScenarios.map((scenario) => scenario.scenarioId),
    suggestedScenarioType: definition.suggestedScenarioType,
    rationale: definition.rationale
  };
}

function buildScenarioCoverageEntry(scenario, evaluationResult) {
  return {
    scenarioId: scenario.scenarioId,
    scenarioName: scenario.scenarioName,
    coverageTags: [...(scenario.coverageTags ?? [])],
    actualFlaggedDomains: [...(evaluationResult?.actualFlaggedDomains ?? [])],
    actualOverallCategory: evaluationResult?.actualOverallCategory ?? 'unknown',
    explainableReasons: [...(evaluationResult?.explainableReasons ?? [])],
    pass: evaluationResult?.pass ?? false
  };
}

function buildRecommendedAdditions(domains) {
  return domains.map((domain) => ({
    suggestedScenarioType: domain.suggestedScenarioType,
    targetCoverageDomain: domain.domainId,
    rationale: domain.rationale,
    safetyBoundary: FICTIONAL_SCENARIO_ONLY
  }));
}

function classifyCoverageStatus(count) {
  if (count >= 2) return 'covered';
  if (count === 1) return 'under-covered';
  return 'not-covered';
}
