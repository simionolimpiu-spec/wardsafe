import { describe, expect, it } from 'vitest';
import { simulationRiskSupportEvaluationScenarios } from '../data/simulationRiskSupportEvaluationScenarios.js';
import { simulationScenarioCoverageExample } from '../data/simulationScenarioCoverageExample.js';
import { scanStrictSafetyLanguage } from './safetyLanguage.js';
import { analyzeSimulationScenarioCoverage } from './simulationScenarioCoverage.js';

const PERFORMANCE_METRIC_PATTERN =
  /\baccuracy\b|\bsensitivity\b|\bspecificity\b|\bAUROC\b|\bF1\b|\bcalibration\b|\bpredictive performance\b|\bbenchmark\b|\bmodel performance\b/i;

function buildDomainIndex(report) {
  return new Map(
    [...report.coveredDomains, ...report.underCoveredDomains, ...report.uncoveredDomains]
      .map((domain) => [domain.domainId, domain])
  );
}

describe('simulation scenario coverage analysis', () => {
  it('builds a deterministic fictional-scenario coverage report with the expected metadata', () => {
    const scenarios = JSON.parse(JSON.stringify(simulationRiskSupportEvaluationScenarios));
    const first = analyzeSimulationScenarioCoverage({ scenarios });
    const second = analyzeSimulationScenarioCoverage({
      scenarios: JSON.parse(JSON.stringify(scenarios))
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      coverageVersion: 'simulation-scenario-coverage-v1',
      simulationOnly: true,
      source: 'fictional scenario fixtures',
      generatedBy: 'deterministic rules',
      humanReviewRequired: true,
      clinicalUse: 'not for live clinical deployment',
      structuredReviewSupport: expect.stringContaining('Structured review support'),
      totalScenarios: simulationRiskSupportEvaluationScenarios.length,
      safetyLanguageCheck: {
        passed: true,
        violationCount: 0
      }
    });
    expect(first.scenarioCoverage).toHaveLength(simulationRiskSupportEvaluationScenarios.length);
    expect(first.scenarioCoverage.map((scenario) => scenario.scenarioId)).toEqual(
      simulationRiskSupportEvaluationScenarios.map((scenario) => scenario.scenarioId)
    );
    expect(first.scenarioCoverage.every((scenario) =>
      scenario.pass === true &&
      Array.isArray(scenario.coverageTags) &&
      Array.isArray(scenario.actualFlaggedDomains) &&
      Array.isArray(scenario.explainableReasons) &&
      scenario.explainableReasons.length > 0
    )).toBe(true);
    expect(first.recommendedFictionalScenarioAdditions.every((suggestion) =>
      suggestion.safetyBoundary === 'fictional scenario only'
    )).toBe(true);
  });

  it('classifies known coverage domains without using clinical performance metrics', () => {
    const report = analyzeSimulationScenarioCoverage({
      scenarios: simulationRiskSupportEvaluationScenarios
    });
    const domainIndex = buildDomainIndex(report);
    const serialized = JSON.stringify(report);

    expect(report.coveredDomains.map((domain) => domain.domainId)).toEqual([
      'documentationQuality',
      'handoverCompleteness',
      'escalationReadiness',
      'dischargeReadiness',
      'missingObservationDocumentation',
      'missingHandoverField',
      'dischargeReadinessBlocker'
    ]);
    expect(report.underCoveredDomains.map((domain) => domain.domainId)).toEqual([
      'multipleSimultaneousGaps',
      'partialInputHandling',
      'lowSignalBaseline',
      'unresolvedEscalationCue'
    ]);
    expect(report.uncoveredDomains).toEqual([]);
    expect(domainIndex.get('documentationQuality')).toMatchObject({
      coverageStatus: 'covered',
      scenarioCount: 3
    });
    expect(domainIndex.get('escalationReadiness')).toMatchObject({
      coverageStatus: 'covered',
      scenarioCount: 4
    });
    expect(domainIndex.get('multipleSimultaneousGaps')).toMatchObject({
      coverageStatus: 'under-covered',
      scenarioCount: 1
    });
    expect(domainIndex.get('lowSignalBaseline')).toMatchObject({
      coverageStatus: 'under-covered',
      scenarioCount: 1
    });
    expect(report.recommendedFictionalScenarioAdditions.map((suggestion) =>
      suggestion.targetCoverageDomain
    )).toEqual([
      'multipleSimultaneousGaps',
      'partialInputHandling',
      'lowSignalBaseline',
      'unresolvedEscalationCue'
    ]);
    expect(scanStrictSafetyLanguage(report).passed).toBe(true);
    expect(serialized).not.toMatch(
      /\bdiagnosis\b|\bdiagnose\b|\bdiagnostic\b|\bprescribe\b|\bprescribing\b|\bprescription\b/i
    );
    expect(serialized).not.toMatch(
      /\btreatment recommendation\b|\bautonomous\s+(?:clinical\s+)?decision(?:s|-making| making)?\b|\blive NHS deployment\b|\bclinical validation\b/i
    );
    expect(serialized).not.toMatch(
      /\bgive potassium\b|\bpatient needs potassium\b|\bpotassium recommendation\b/i
    );
    expect(serialized).not.toMatch(PERFORMANCE_METRIC_PATTERN);
  });

  it('suggests fictional additions for under-covered and uncovered domains', () => {
    const report = analyzeSimulationScenarioCoverage({
      scenarios: simulationRiskSupportEvaluationScenarios.filter((scenario) =>
        scenario.scenarioId === 'scenario-documentation-gap'
      ),
      coverageDefinitions: [
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
        }
      ]
    });

    expect(report.coveredDomains).toEqual([]);
    expect(report.underCoveredDomains).toEqual([
      expect.objectContaining({
        domainId: 'documentationQuality',
        coverageStatus: 'under-covered',
        scenarioCount: 1
      })
    ]);
    expect(report.uncoveredDomains).toEqual([
      expect.objectContaining({
        domainId: 'handoverCompleteness',
        coverageStatus: 'not-covered',
        scenarioCount: 0
      })
    ]);
    expect(report.recommendedFictionalScenarioAdditions).toEqual([
      expect.objectContaining({
        targetCoverageDomain: 'documentationQuality',
        safetyBoundary: 'fictional scenario only'
      }),
      expect.objectContaining({
        targetCoverageDomain: 'handoverCompleteness',
        safetyBoundary: 'fictional scenario only'
      })
    ]);
  });

  it('exports a tiny fictional coverage example for downstream consumers', () => {
    const expected = analyzeSimulationScenarioCoverage({
      scenarios: simulationRiskSupportEvaluationScenarios
    });

    expect(simulationScenarioCoverageExample).toEqual(expected);
    expect(scanStrictSafetyLanguage(simulationScenarioCoverageExample).passed).toBe(true);
    expect(JSON.stringify(simulationScenarioCoverageExample)).not.toMatch(PERFORMANCE_METRIC_PATTERN);
  });
});
