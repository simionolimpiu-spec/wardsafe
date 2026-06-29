import { simulationRiskSupportEvaluationScenarios } from '../src/data/simulationRiskSupportEvaluationScenarios.js';
import {
  evaluateSimulationRiskSupportScenarios,
  scanSimulationRiskSupportLanguage
} from '../src/domain/simulationRiskSupportEvaluation.js';

const REPORT_VERSION = 'simulation-risk-support-read-only-report-v1';
const REPORT_TYPE = 'simulation-risk-support-read-only-report';
const SOURCE = 'fictional scenario fixtures';
const GENERATED_BY = 'deterministic rules';
const CLINICAL_USE = 'not for live clinical deployment';
const REVIEW_PURPOSE = 'Structured review support only; nurses and clinicians remain responsible for judgement and escalation.';

const SAFETY_BOUNDARY = Object.freeze({
  noLivePatientData: true,
  directCareIdentifiers: false,
  humanReviewRequired: true
});

const FLAGGED_DOMAIN_DEFINITIONS = [
  {
    signalType: 'documentation_quality',
    label: 'documentation gap',
    aggregateKey: 'documentationGapCount'
  },
  {
    signalType: 'handover_completeness',
    label: 'handover completeness issue',
    aggregateKey: 'handoverCompletenessIssueCount'
  },
  {
    signalType: 'escalation_readiness',
    label: 'escalation readiness cue',
    aggregateKey: 'escalationReadinessCueCount'
  },
  {
    signalType: 'discharge_readiness',
    label: 'discharge-readiness blocker',
    aggregateKey: 'dischargeReadinessBlockerCount'
  }
];

/**
 * Build the simulation-only read-only report for the fictional evaluation suite.
 *
 * @param {...unknown} args
 * @returns {Object}
 */
export function createSimulationRiskSupportReadOnlyReport(...args) {
  if (args.length > 0) {
    throw new Error('Simulation risk-support report accepts no patient input or overrides.');
  }

  const evaluation = evaluateSimulationRiskSupportScenarios({
    scenarios: simulationRiskSupportEvaluationScenarios
  });
  const report = buildSimulationRiskSupportReadOnlyReport(evaluation);
  const safetyLanguageCheck = scanSimulationRiskSupportLanguage(report);

  return {
    ...report,
    safetyLanguageCheck: {
      passed: safetyLanguageCheck.passed,
      matches: safetyLanguageCheck.matches
    }
  };
}

/**
 * Build a compact reference for consumers that only need the read-only report summary.
 *
 * @returns {Object}
 */
export function createSimulationRiskSupportReportReference() {
  const report = createSimulationRiskSupportReadOnlyReport();

  return {
    reportType: report.reportType,
    reportVersion: report.reportVersion,
    product: report.product,
    source: report.source,
    simulationOnly: report.simulationOnly,
    humanReviewRequired: report.humanReviewRequired,
    generatedBy: report.generatedBy,
    clinicalUse: report.clinicalUse,
    reviewPurpose: report.reviewPurpose,
    totalScenarios: report.totalScenarios,
    passedScenarios: report.passedScenarios,
    failedScenarios: report.failedScenarios,
    aggregateSummary: report.aggregateSummary,
    flaggedDomainSummary: report.flaggedDomainSummary
  };
}

function buildSimulationRiskSupportReadOnlyReport(evaluation) {
  const scenarioResults = evaluation.scenarioResults ?? [];
  const aggregateSummary = buildAggregateSummary(scenarioResults);

  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    reportVersion: REPORT_VERSION,
    product: 'SafeFlow',
    source: SOURCE,
    simulationOnly: true,
    humanReviewRequired: true,
    generatedBy: GENERATED_BY,
    clinicalUse: CLINICAL_USE,
    accessMode: 'read-only',
    reviewPurpose: REVIEW_PURPOSE,
    safetyBoundary: { ...SAFETY_BOUNDARY },
    evaluationVersion: evaluation.evaluationVersion,
    totalScenarios: evaluation.totalScenarios ?? scenarioResults.length,
    passedScenarios: evaluation.passedScenarios ?? 0,
    failedScenarios: evaluation.failedScenarios ?? 0,
    scenarioResults,
    aggregateSummary,
    flaggedDomainSummary: buildFlaggedDomainSummary(aggregateSummary)
  };
}

function buildAggregateSummary(scenarioResults) {
  const summary = {
    documentationGapCount: 0,
    handoverCompletenessIssueCount: 0,
    escalationReadinessCueCount: 0,
    dischargeReadinessBlockerCount: 0,
    scenariosWithMultipleGaps: 0
  };

  for (const result of scenarioResults) {
    const domains = new Set(result.actualFlaggedDomains ?? []);

    if (domains.has('documentation_quality')) summary.documentationGapCount += 1;
    if (domains.has('handover_completeness')) summary.handoverCompletenessIssueCount += 1;
    if (domains.has('escalation_readiness')) summary.escalationReadinessCueCount += 1;
    if (domains.has('discharge_readiness')) summary.dischargeReadinessBlockerCount += 1;
    if (domains.size > 1) summary.scenariosWithMultipleGaps += 1;
  }

  return summary;
}

function buildFlaggedDomainSummary(aggregateSummary) {
  return FLAGGED_DOMAIN_DEFINITIONS.map(({ signalType, label, aggregateKey }) => ({
    signalType,
    label,
    count: aggregateSummary[aggregateKey]
  }));
}
