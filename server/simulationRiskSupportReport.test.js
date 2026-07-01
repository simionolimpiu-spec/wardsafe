import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../src/data/simulatedPatients.js';
import { simulationRiskSupportReportExample } from '../src/data/simulationRiskSupportReportExample.js';
import { simulationRiskSupportEvaluationScenarios } from '../src/data/simulationRiskSupportEvaluationScenarios.js';
import { evaluateSimulationRiskSupportScenarios } from '../src/domain/simulationRiskSupportEvaluation.js';
import {
  createSimulationRiskSupportReadOnlyReport,
  createSimulationRiskSupportReportReference
} from './simulationRiskSupportReport.js';

describe('simulation risk-support read-only report', () => {
  it('builds a deterministic report from bundled fictional fixtures', () => {
    const first = createSimulationRiskSupportReadOnlyReport();
    const second = createSimulationRiskSupportReadOnlyReport();
    const expectedEvaluation = evaluateSimulationRiskSupportScenarios({
      scenarios: simulationRiskSupportEvaluationScenarios
    });
    const serialized = JSON.stringify(first);

    expect(first).toEqual(second);
    expect(first).toEqual(simulationRiskSupportReportExample);
    expect(first).toMatchObject({
      reportType: 'simulation-risk-support-read-only-report',
      reportVersion: 'simulation-risk-support-read-only-report-v1',
      product: 'SafeFlow',
      source: 'fictional scenario fixtures',
      simulationOnly: true,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: 'not for live clinical deployment',
      accessMode: 'read-only',
      structuredReviewSupport: expect.stringContaining('simulation-only prototype'),
      reviewPurpose: expect.stringContaining('Structured review support only'),
      evaluationVersion: 'simulation-risk-support-evaluation-v1',
      totalScenarios: simulationRiskSupportEvaluationScenarios.length,
      passedScenarios: simulationRiskSupportEvaluationScenarios.length,
      failedScenarios: 0
    });
    expect(first.scenarioResults).toEqual(expectedEvaluation.scenarioResults);
    expect(first.scenarioResults.map((result) => result.scenarioId)).toEqual(
      simulationRiskSupportEvaluationScenarios.map((scenario) => scenario.scenarioId)
    );
    expect(first.scenarioResults.map((result) => result.patientId)).toEqual(
      simulationRiskSupportEvaluationScenarios.map((scenario) => scenario.patient.id)
    );
    expect(first.scenarioResults.every((result) =>
      result.scenarioId &&
      result.patientId &&
      result.journeyId &&
      result.contractId &&
      Array.isArray(result.actualFlaggedDomains) &&
      Array.isArray(result.actualFlaggedSignals) &&
      Array.isArray(result.explainableReasons) &&
      Array.isArray(result.reviewNotes) &&
      result.safetyMetadata?.simulationOnly === true &&
      result.safetyMetadata?.humanReviewRequired === true
    )).toBe(true);
    expect(first.aggregateSummary).toEqual({
      documentationGapCount: 3,
      handoverCompletenessIssueCount: 3,
      escalationReadinessCueCount: 4,
      dischargeReadinessBlockerCount: 4,
      scenariosWithMultipleGaps: 4,
      scenariosWithMissingDocumentation: 3,
      scenariosWithDischargeBlockers: 4
    });
    expect(first.aggregateDomainSummary).toEqual([
      { signalType: 'documentation_quality', label: 'documentation gap', count: 3 },
      { signalType: 'handover_completeness', label: 'handover completeness issue', count: 3 },
      { signalType: 'escalation_readiness', label: 'escalation readiness cue', count: 4 },
      { signalType: 'discharge_readiness', label: 'discharge-readiness blocker', count: 4 }
    ]);
    expect(first.flaggedDomainSummary).toEqual(first.aggregateDomainSummary);
    expect(first.safetyLanguageCheck).toEqual({
      passed: true,
      matches: []
    });
    expect(serialized).not.toMatch(/\bdiagnosis\b|\bdiagnose\b|\bdiagnostic\b/i);
    expect(serialized).not.toMatch(/\bprescribe\b|\bprescribing\b|\bprescription\b/i);
    expect(serialized).not.toMatch(/\btreatment recommendation\b|\bAI decision\b|\bclinical decision engine\b|\bautonomous care\b|\blive NHS deployment\b/i);
    expect(serialized).not.toMatch(/\bgive potassium\b|\bpatient needs potassium\b|\badminister potassium\b|\bpotassium recommendation\b/i);
  });

  it('provides a compact read-only report reference for snapshot consumers', () => {
    const reference = createSimulationRiskSupportReportReference();

    expect(reference).toMatchObject({
      reportType: 'simulation-risk-support-read-only-report',
      source: 'fictional scenario fixtures',
      simulationOnly: true,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: 'not for live clinical deployment',
      structuredReviewSupport: expect.stringContaining('simulation-only prototype'),
      reviewPurpose: expect.stringContaining('Structured review support only'),
      totalScenarios: 7,
      passedScenarios: 7,
      failedScenarios: 0,
      aggregateSummary: {
        documentationGapCount: 3,
        handoverCompletenessIssueCount: 3,
        escalationReadinessCueCount: 4,
        dischargeReadinessBlockerCount: 4,
        scenariosWithMultipleGaps: 4,
        scenariosWithMissingDocumentation: 3,
        scenariosWithDischargeBlockers: 4
      }
    });
    expect(reference.aggregateDomainSummary).toEqual([
      { signalType: 'documentation_quality', label: 'documentation gap', count: 3 },
      { signalType: 'handover_completeness', label: 'handover completeness issue', count: 3 },
      { signalType: 'escalation_readiness', label: 'escalation readiness cue', count: 4 },
      { signalType: 'discharge_readiness', label: 'discharge-readiness blocker', count: 4 }
    ]);
    expect(reference.scenarioResults).toBeUndefined();
  });

  it('rejects patient input overrides', () => {
    expect(() => createSimulationRiskSupportReadOnlyReport({
      patient: simulatedPatients[0]
    })).toThrow(/accepts no patient input/i);
  });
});
