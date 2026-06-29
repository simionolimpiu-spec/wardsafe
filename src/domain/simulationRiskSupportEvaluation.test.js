import { describe, expect, it } from 'vitest';
import { simulationRiskSupportEvaluationExample } from '../data/simulationRiskSupportEvaluationExample.js';
import { simulationRiskSupportEvaluationScenarios } from '../data/simulationRiskSupportEvaluationScenarios.js';
import {
  evaluateSimulationRiskSupportScenarios,
  scanSimulationRiskSupportLanguage
} from './simulationRiskSupportEvaluation.js';

describe('simulation risk-support evaluation harness', () => {
  it('evaluates the fictional scenario suite deterministically', () => {
    const scenarios = JSON.parse(JSON.stringify(simulationRiskSupportEvaluationScenarios));
    const first = evaluateSimulationRiskSupportScenarios({ scenarios });
    const second = evaluateSimulationRiskSupportScenarios({
      scenarios: JSON.parse(JSON.stringify(scenarios))
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      evaluationVersion: 'simulation-risk-support-evaluation-v1',
      simulationOnly: true,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: 'not for live clinical deployment',
      totalScenarios: simulationRiskSupportEvaluationScenarios.length,
      passedScenarios: simulationRiskSupportEvaluationScenarios.length,
      failedScenarios: 0
    });
    expect(first.safetyLanguageCheck).toMatchObject({
      passed: true
    });
    expect(scanSimulationRiskSupportLanguage(first).passed).toBe(true);
    expect(first.scenarioResults).toHaveLength(simulationRiskSupportEvaluationScenarios.length);
    expect(first.scenarioResults.every((result) =>
      result.pass === true &&
      Array.isArray(result.explainableReasons) &&
      result.explainableReasons.length > 0 &&
      result.safetyMetadata?.simulationOnly === true &&
      result.safetyMetadata?.humanReviewRequired === true &&
      result.safetyMetadata?.generatedBy === 'deterministic rules' &&
      result.safetyMetadata?.clinicalUse === 'not for live clinical deployment'
    )).toBe(true);
    expect(first.scenarioResults.every((result) =>
      Array.isArray(result.actualFlaggedDomains) &&
      Array.isArray(result.expectedFlaggedDomains) &&
      result.actualFlaggedDomains.join('|') === result.expectedFlaggedDomains.join('|') &&
      result.actualOverallCategory === result.expectedOverallCategory
    )).toBe(true);
    expect(first.scenarioResults.every((result) =>
      result.actualFlaggedSignals.every((signal) => Array.isArray(signal.reasons) && signal.reasons.length > 0)
    )).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/\bdiagnosis\b|\bdiagnose\b|\bdiagnostic\b/i);
    expect(JSON.stringify(first)).not.toMatch(/\bprescribe\b|\bprescribing\b|\bprescription\b/i);
    expect(JSON.stringify(first)).not.toMatch(/\btreatment recommendation\b|\bAI decision\b|\bclinical decision engine\b|\bautonomous care\b|\blive NHS deployment\b/i);
    expect(JSON.stringify(first)).not.toMatch(/\bgive potassium\b|\bpatient needs potassium\b|\badminister potassium\b|\bpotassium recommendation\b/i);
  });

  it('handles partial but safe fictional input without breaking the report shape', () => {
    const report = evaluateSimulationRiskSupportScenarios({
      scenarios: simulationRiskSupportEvaluationScenarios.filter((scenario) =>
        scenario.scenarioId === 'scenario-partial-safe-input'
      )
    });
    const [result] = report.scenarioResults;

    expect(report).toMatchObject({
      totalScenarios: 1,
      passedScenarios: 1,
      failedScenarios: 0
    });
    expect(result).toMatchObject({
      scenarioId: 'scenario-partial-safe-input',
      scenarioName: 'Partial or malformed but safe fictional input',
      actualOverallCategory: 'documentation gap',
      pass: true
    });
    expect(result.missingDocumentationFields).toEqual(expect.arrayContaining([
      'plan',
      'sbar.recommendation',
      'currentState',
      'auditTrail',
      'responseHistory'
    ]));
    expect(result.dischargeReadinessBlockers).toEqual(expect.arrayContaining([
      'Discharge blocker: handover is not fully complete.'
    ]));
  });

  it('exports a tiny evaluation report example for downstream consumers', () => {
    const expected = evaluateSimulationRiskSupportScenarios({
      scenarios: simulationRiskSupportEvaluationScenarios
    });

    expect(simulationRiskSupportEvaluationExample).toEqual(expected);
    expect(JSON.stringify(simulationRiskSupportEvaluationExample)).not.toMatch(/\bdiagnosis\b|\bprescribe\b|\btreatment\b/i);
  });
});
