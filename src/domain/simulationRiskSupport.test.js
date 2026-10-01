import { describe, expect, it } from 'vitest';
import { simulatedPatients } from '../data/simulatedPatients.js';
import { evaluatePotassiumSafetyGap } from './safetyRules.js';
import { createSimulationRiskSupport } from './simulationRiskSupport.js';

describe('createSimulationRiskSupport', () => {
  it('returns deterministic and explainable signals for a review-needed scenario', () => {
    const patient = JSON.parse(JSON.stringify(simulatedPatients[0]));
    const safetyFlag = evaluatePotassiumSafetyGap(patient);

    const first = createSimulationRiskSupport({ patient, safetyFlag });
    const second = createSimulationRiskSupport({
      patient: JSON.parse(JSON.stringify(patient)),
      safetyFlag
    });
    const serialized = JSON.stringify(first);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      patientId: 'DCU-031',
      version: 'simulation-risk-support-v0',
      simulationOnly: true,
      summary: {
        category: 'review suggested'
      }
    });
    expect(first.summary.reasons).toEqual(expect.arrayContaining([
      expect.stringMatching(/documentation gap/i),
      expect.stringMatching(/handover cue/i),
      expect.stringMatching(/discharge blocker/i)
    ]));
    expect(first.signals).toHaveLength(4);
    expect(first.signals.every((signal) => Array.isArray(signal.reasons) && signal.reasons.length > 0)).toBe(true);
    expect(serialized).toContain('Simulation-only support for fictional patient journeys');
    expect(serialized).toContain('handover cue');
    expect(serialized).toContain('discharge blocker');
    expect(serialized).not.toMatch(/\bdiagnosis\b|\bdiagnose\b|\bdiagnostic\b/i);
    expect(serialized).not.toMatch(/\bprescribe\b|\bprescribing\b|\bprescription\b/i);
    expect(serialized).not.toMatch(/\bgive potassium\b|\bpatient needs potassium\b|\badminister potassium\b/i);
    expect(serialized).not.toMatch(/\btreatment\b/i);
  });

  it('returns a simulation-only empty contract when no patient is supplied', () => {
    const contract = createSimulationRiskSupport();

    expect(contract).toMatchObject({
      simulationOnly: true,
      humanReviewRequired: true,
      summary: {
        score: 0,
        category: 'review suggested'
      },
      overallSignal: {
        category: 'review suggested',
        status: 'review suggested',
        contributingSignals: []
      }
    });
    expect(contract.metadata).toMatchObject({
      simulationOnly: true,
      humanReviewRequired: true
    });
    expect(contract.reviewNotes).toEqual(expect.arrayContaining([
      expect.stringMatching(/Structured review support/i),
      expect.stringMatching(/Human review required/i)
    ]));
    expect(contract.signals).toEqual([]);
    expect(contract.documentationQuality).toMatchObject({
      category: 'review suggested',
      status: 'review suggested'
    });
    expect(contract.handoverCompleteness).toMatchObject({
      category: 'review suggested',
      status: 'review suggested'
    });
    expect(contract.escalationReadiness).toMatchObject({
      category: 'review suggested',
      status: 'review suggested'
    });
    expect(contract.dischargeReadiness).toMatchObject({
      category: 'review suggested',
      status: 'review suggested'
    });
  });

  it('keeps simulation-safe category and status values within the expected enums for partial input', () => {
    const contract = createSimulationRiskSupport({
      patient: {
        id: 'DCU-EDGE',
        handoverComplete: 100,
        dischargeReady: true,
        dischargeBlockers: [],
        tasks: [],
        currentState: ['Observation active'],
        auditTrail: ['09:05 note recorded'],
        responseHistory: ['09:05 note recorded'],
        sbar: {
          assessment: 'Stable',
          recommendation: 'Review and document'
        },
        plan: 'Review completed.'
      }
    });

    const allowedSummaryCategories = new Set(['ready', 'review suggested', 'documentation gap']);
    const allowedSignalCategories = new Set([
      'ready',
      'review suggested',
      'documentation gap',
      'handover cue',
      'escalation readiness',
      'discharge blocker'
    ]);

    expect(contract.simulationOnly).toBe(true);
    expect(contract.humanReviewRequired).toBe(true);
    expect(contract.metadata).toMatchObject({
      simulationOnly: true,
      humanReviewRequired: true
    });
    expect(allowedSummaryCategories.has(contract.summary.category)).toBe(true);
    expect(contract.overallSignal.category).toBe(contract.summary.category);
    expect(contract.signals.every((signal) => allowedSignalCategories.has(signal.category))).toBe(true);
    expect(contract.signals.every((signal) => signal.status === signal.category)).toBe(true);
  });

  it('keeps a stable discharge-ready scenario in the ready band', () => {
    const patient = JSON.parse(JSON.stringify(simulatedPatients[4]));
    const support = createSimulationRiskSupport({
      patient,
      safetyFlag: evaluatePotassiumSafetyGap(patient)
    });
    const dischargeSignal = support.signals.find((signal) => signal.signalType === 'discharge_readiness');

    expect(support.summary.category).toBe('ready');
    expect(support.summary.score).toBeGreaterThanOrEqual(90);
    expect(dischargeSignal).toMatchObject({
      label: 'Discharge readiness blockers',
      category: 'ready'
    });
    expect(dischargeSignal.reasons.join(' ')).toContain('No discharge blockers are listed.');
  });
});
