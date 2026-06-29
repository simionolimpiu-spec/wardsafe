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
