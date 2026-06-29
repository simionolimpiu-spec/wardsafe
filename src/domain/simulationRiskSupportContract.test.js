import { describe, expect, it } from 'vitest';
import { simulationRiskSupportContractExample } from '../data/simulationRiskSupportContractExample.js';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from './safetyRules.js';
import { buildSimulationRiskSupportContract } from './simulationRiskSupport.js';

describe('simulation risk-support contract', () => {
  it('returns a stable, explainable contract for the main fictional fixture', () => {
    const patient = JSON.parse(JSON.stringify(simulatedPatients[0]));
    const safetyFlag = evaluatePotassiumSafetyGap(patient);

    const contract = buildSimulationRiskSupportContract({
      patient,
      journey: { id: 'scenario-electrolyte-aki' },
      safetyFlag
    });
    const serialized = JSON.stringify(contract);

    expect(contract).toMatchObject({
      contractVersion: 'simulation-risk-support-contract-v1',
      contractType: 'simulation-risk-support-contract',
      contractId: 'scenario-electrolyte-aki-simulation-risk-support',
      version: 'simulation-risk-support-v0',
      patientId: 'DCU-031',
      journeyId: 'scenario-electrolyte-aki',
      syntheticPatientRef: 'DCU-031',
      source: 'fictional scenario fixture',
      simulationOnly: true,
      humanReviewRequired: true,
      generatedBy: 'deterministic rules',
      clinicalUse: 'not for live clinical deployment',
      metadata: {
        simulationOnly: true,
        source: 'fictional scenario fixture',
        humanReviewRequired: true,
        generatedBy: 'deterministic rules',
        clinicalUse: 'not for live clinical deployment'
      },
      summary: {
        category: 'review suggested'
      },
      overallSignal: {
        signalType: 'overall',
        status: 'review suggested',
        contributingSignals: [
          'documentation_quality',
          'handover_completeness',
          'escalation_readiness',
          'discharge_readiness'
        ]
      }
    });
    expect(contract.reviewNotes).toEqual(expect.arrayContaining([
      expect.stringMatching(/Structured review support/i),
      expect.stringMatching(/Human review required/i)
    ]));
    expect(contract.documentationQuality.missingFields).toEqual(['plan']);
    expect(contract.documentationQuality.missingFieldDetails).toEqual([
      { field: 'plan', note: 'Documentation gap: plan field is blank.' }
    ]);
    expect(contract.handoverCompleteness.blockerDetails).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'handoverComplete' }),
      expect.objectContaining({ field: 'tasks' })
    ]));
    expect(contract.dischargeReadiness.blockerDetails).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'handoverComplete' }),
      expect.objectContaining({ field: 'tasks' }),
      expect.objectContaining({ field: 'dischargeBlockers[0]' }),
      expect.objectContaining({ field: 'dischargeBlockers[1]' })
    ]));
    expect(contract.signals).toHaveLength(4);
    expect(contract.signals.every((signal) => Array.isArray(signal.reasons) && signal.reasons.length > 0)).toBe(true);
    expect(serialized).not.toMatch(/\bdiagnosis\b|\bdiagnose\b|\bdiagnostic\b/i);
    expect(serialized).not.toMatch(/\bprescribe\b|\bprescribing\b|\bprescription\b/i);
    expect(serialized).not.toMatch(/\btreatment\b/i);
    expect(serialized).not.toMatch(/\bautonomous clinical decision\b/i);
    expect(serialized).not.toMatch(/\bgive potassium\b|\bpatient needs potassium\b|\badminister potassium\b|\bpotassium recommendation\b/i);
  });

  it('handles a partial fictional input without losing the contract shape', () => {
    const contract = buildSimulationRiskSupportContract({
      patient: {
        id: 'DCU-999',
        handoverComplete: 0,
        dischargeReady: false,
        dischargeBlockers: [],
        tasks: [],
        currentState: [],
        auditTrail: [],
        responseHistory: [],
        sbar: {}
      }
    });
    const serialized = JSON.stringify(contract);

    expect(contract).toMatchObject({
      patientId: 'DCU-999',
      journeyId: 'DCU-999',
      simulationOnly: true,
      humanReviewRequired: true,
      summary: {
        category: 'documentation gap'
      }
    });
    expect(contract.signals).toHaveLength(4);
    expect(contract.documentationQuality.missingFields).toEqual(expect.arrayContaining([
      'plan',
      'sbar.recommendation',
      'currentState',
      'auditTrail',
      'responseHistory'
    ]));
    expect(contract.dischargeReadiness.blockerDetails).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: 'handoverComplete',
        note: 'Handover is not fully complete.'
      })
    ]));
    expect(serialized).not.toMatch(/\bdiagnosis\b|\bprescribe\b|\btreatment\b/i);
  });

  it('exports a tiny fixture-backed example for downstream consumers', () => {
    const serialized = JSON.stringify(simulationRiskSupportContractExample);

    expect(simulationRiskSupportContractExample).toMatchObject({
      patientId: 'DCU-031',
      journeyId: 'scenario-electrolyte-aki',
      source: 'fictional scenario fixture',
      metadata: {
        simulationOnly: true,
        humanReviewRequired: true
      }
    });
    expect(serialized).toContain('scenario-electrolyte-aki-simulation-risk-support');
    expect(serialized).toContain('simulation-risk-support-contract');
    expect(serialized).not.toMatch(/\bdiagnosis\b|\bprescribe\b|\btreatment\b/i);
  });
});
